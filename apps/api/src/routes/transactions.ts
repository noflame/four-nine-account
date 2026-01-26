import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { createDb, transactions, users, creditCardInstallments, accounts, creditCards } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

// Schema Validator
const transactionSchema = z.object({
    type: z.enum(['expense', 'income', 'transfer']),
    amount: z.number().positive(), // Actual amount (e.g. 100)
    date: z.string().transform(str => new Date(str)), // ISO Date string
    description: z.string().min(1),
    categoryId: z.number().nullable().optional(),
    sourceAccountId: z.number().nullable().optional(),
    destinationAccountId: z.number().nullable().optional(),
});



// GET /api/transactions
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');

    // Pagination params
    const limit = Number(c.req.query('limit')) || 20;
    const offset = Number(c.req.query('offset')) || 0;

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);

    const result = await db.query.transactions.findMany({
        where: eq(transactions.ledgerId, ledger.id),
        orderBy: [desc(transactions.date), desc(transactions.createdAt)],
        limit: limit,
        offset: offset,
        with: {
            category: true,
            sourceAccount: true,
            destinationAccount: true,
            creditCard: true,
            installment: true,
            user: { // Include Creator Name
                columns: { name: true }
            }
        }
    });

    return c.json(result);
});

// POST /api/transactions
app.post('/', zValidator('json', transactionSchema.extend({
    creditCardId: z.number().optional(),
    installmentTotalMonths: z.number().optional().default(1),
}).superRefine((data, ctx) => {
    // Re-implement logic validation for credit cards
    if (data.type === 'expense') {
        if (!data.sourceAccountId && !data.creditCardId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Either Source Account or Credit Card is required for Expense",
                path: ["sourceAccountId"]
            });
        }
    }
    if (data.type === 'income' && !data.destinationAccountId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Destination Account required",
            path: ["destinationAccountId"]
        });
    }
    if (data.type === 'transfer' && (!data.sourceAccountId || !data.destinationAccountId)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Source and Dest Accounts required",
            path: ["sourceAccountId"]
        });
    }
})), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const ledger = c.get('ledger');
    const data = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot create transactions' }, 403);

    const amountInt = Math.round(data.amount * 10000);

    // 2. Helper to verify Account Access
    const verifyAccountAccess = async (accountId: number | null | undefined) => {
        if (!accountId) return;
        const account = await db.query.accounts.findFirst({
            where: and(eq(accounts.id, accountId), eq(accounts.ledgerId, ledger.id))
        });
        if (!account) throw new Error(`Account ${accountId} not found in this ledger`);
    };

    try {
        await verifyAccountAccess(data.sourceAccountId);
        await verifyAccountAccess(data.destinationAccountId);

        let installmentId = undefined;

        // Handle Installments
        if (data.creditCardId && data.installmentTotalMonths > 1) {
            // Check Credit Card Access
            const card = await db.query.creditCards.findFirst({
                where: and(eq(creditCards.id, data.creditCardId), eq(creditCards.ledgerId, ledger.id))
            });
            if (!card) throw new Error(`Credit Card ${data.creditCardId} not found in this ledger`);

            const installment = await db.insert(creditCardInstallments).values({
                cardId: data.creditCardId,
                description: data.description,
                totalAmount: amountInt,
                totalMonths: data.installmentTotalMonths,
                remainingMonths: data.installmentTotalMonths, // Start with full term
                startDate: new Date(data.date), // Use transaction date
            }).returning();
            installmentId = installment[0].id;
        } else if (data.creditCardId) {
            const card = await db.query.creditCards.findFirst({
                where: and(eq(creditCards.id, data.creditCardId), eq(creditCards.ledgerId, ledger.id))
            });
            if (!card) throw new Error(`Credit Card ${data.creditCardId} not found in this ledger`);
        }

        // 1. Create Transaction Record
        const newTransaction = await db.insert(transactions).values({
            userId: user.id,
            ledgerId: ledger.id,
            date: data.date,
            amount: amountInt,
            description: data.description,
            categoryId: data.categoryId,
            sourceAccountId: data.sourceAccountId, // Can be NULL if CC
            destinationAccountId: data.destinationAccountId,
            creditCardId: data.creditCardId,
            installmentId: installmentId,
            createdAt: new Date(),
        }).returning();

        // 2. Update Account Balances
        // Logic: Removed strict 'user_id' check in SQL, relied on verifyAccountAccess
        if (data.type === 'expense' && !data.creditCardId) {
            if (data.sourceAccountId) {
                // Decrease source (Cash/Bank)
                await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${data.sourceAccountId}`);
            }
        } else if (data.type === 'income' && data.destinationAccountId) {
            // Increase destination
            await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${data.destinationAccountId}`);
        } else if (data.type === 'transfer' && data.sourceAccountId && data.destinationAccountId) {
            // Transfer
            await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${data.sourceAccountId}`);
            await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${data.destinationAccountId}`);
        }
        // Note: Credit Card Expense does NOT touch accounts table.

        return c.json(newTransaction[0]);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/transactions/:id
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const id = parseInt(c.req.param('id'));

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot delete transactions' }, 403);

    // 1. Get transaction first to know amount and accounts
    const tx = await db.query.transactions.findFirst({
        where: and(eq(transactions.id, id), eq(transactions.ledgerId, ledger.id))
    });

    if (!tx) return c.json({ error: 'Transaction not found in this ledger' }, 404);

    // 2. Revert Balance Changes (No user_id check in SQL)
    const amountInt = tx.amount;

    if (tx.sourceAccountId && !tx.destinationAccountId) {
        // Revert Expense: Add back to source
        await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${tx.sourceAccountId}`);
    } else if (!tx.sourceAccountId && tx.destinationAccountId) {
        // Revert Income: Subtract from dest
        await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${tx.destinationAccountId}`);
    } else if (tx.sourceAccountId && tx.destinationAccountId) {
        // Revert Transfer: Add to source, subtract from dest
        await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${tx.sourceAccountId}`);
        await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${tx.destinationAccountId}`);
    }

    // 3. Delete Transaction
    await db.delete(transactions).where(eq(transactions.id, id));

    return c.json({ success: true, deletedId: id });
});

// PUT /api/transactions/:id
app.put('/:id', zValidator('json', transactionSchema.extend({
    creditCardId: z.number().optional(),
    installmentTotalMonths: z.number().optional().default(1),
})), async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot edit transactions' }, 403);

    // 1. Get existing transaction
    const tx = await db.query.transactions.findFirst({
        where: and(eq(transactions.id, id), eq(transactions.ledgerId, ledger.id))
    });

    if (!tx) return c.json({ error: 'Transaction not found or unauthorized' }, 404);

    // Helper to verify Account Access (New accounts)
    const verifyAccountAccess = async (accountId: number | null | undefined) => {
        if (!accountId) return;
        const account = await db.query.accounts.findFirst({
            where: and(eq(accounts.id, accountId), eq(accounts.ledgerId, ledger.id))
        });
        if (!account) throw new Error(`Account ${accountId} not found in this ledger`);
    };

    const newAmountInt = Math.round(data.amount * 10000);

    try {
        await verifyAccountAccess(data.sourceAccountId);
        await verifyAccountAccess(data.destinationAccountId);

        // 2. Revert Old Balance Changes (Logic from DELETE)
        const oldAmount = tx.amount;
        if (tx.sourceAccountId && !tx.destinationAccountId) {
            // Revert Expense: Add back to source
            await db.run(sql`UPDATE accounts SET balance = balance + ${oldAmount} WHERE id = ${tx.sourceAccountId}`);
        } else if (!tx.sourceAccountId && tx.destinationAccountId) {
            // Revert Income: Subtract from dest
            await db.run(sql`UPDATE accounts SET balance = balance - ${oldAmount} WHERE id = ${tx.destinationAccountId}`);
        } else if (tx.sourceAccountId && tx.destinationAccountId) {
            // Revert Transfer: Add to source, subtract from dest
            await db.run(sql`UPDATE accounts SET balance = balance + ${oldAmount} WHERE id = ${tx.sourceAccountId}`);
            await db.run(sql`UPDATE accounts SET balance = balance - ${oldAmount} WHERE id = ${tx.destinationAccountId}`);
        }

        // 3. Apply New Balance Changes (Logic from POST)
        if (data.type === 'expense' && !data.creditCardId) {
            if (data.sourceAccountId) {
                await db.run(sql`UPDATE accounts SET balance = balance - ${newAmountInt} WHERE id = ${data.sourceAccountId}`);
            }
        } else if (data.type === 'income' && data.destinationAccountId) {
            await db.run(sql`UPDATE accounts SET balance = balance + ${newAmountInt} WHERE id = ${data.destinationAccountId}`);
        } else if (data.type === 'transfer' && data.sourceAccountId && data.destinationAccountId) {
            await db.run(sql`UPDATE accounts SET balance = balance - ${newAmountInt} WHERE id = ${data.sourceAccountId}`);
            await db.run(sql`UPDATE accounts SET balance = balance + ${newAmountInt} WHERE id = ${data.destinationAccountId}`);
        }

        // 4. Update Transaction Record
        const result = await db.update(transactions)
            .set({
                date: data.date,
                amount: newAmountInt,
                description: data.description,
                categoryId: data.categoryId,
                sourceAccountId: data.sourceAccountId,
                destinationAccountId: data.destinationAccountId,
                creditCardId: data.creditCardId,
            })
            .where(eq(transactions.id, id))
            .returning();

        return c.json(result[0]);

    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
