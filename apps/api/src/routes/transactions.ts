import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createDb, transactions, users, creditCardInstallments } from '@lin-fan/db';
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
    const user = c.get('user');

    // Pagination params
    const limit = Number(c.req.query('limit')) || 20;
    const offset = Number(c.req.query('offset')) || 0;

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const result = await db.query.transactions.findMany({
        where: eq(transactions.userId, userRecord.id),
        orderBy: [desc(transactions.date), desc(transactions.createdAt)],
        limit: limit,
        offset: offset,
        with: {
            category: true,
            sourceAccount: true,
            destinationAccount: true,
            creditCard: true,
            installment: true,
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
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const amountInt = Math.round(data.amount * 10000);

    try {
        let installmentId = undefined;

        // Handle Installments
        if (data.creditCardId && data.installmentTotalMonths > 1) {
            const installment = await db.insert(creditCardInstallments).values({
                cardId: data.creditCardId,
                description: data.description,
                totalAmount: amountInt,
                totalMonths: data.installmentTotalMonths,
                remainingMonths: data.installmentTotalMonths, // Start with full term
                startDate: new Date(data.date), // Use transaction date
            }).returning();
            installmentId = installment[0].id;
        }

        // 1. Create Transaction Record
        const newTransaction = await db.insert(transactions).values({
            userId: userRecord.id,
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
        // Logic:
        // - If Credit Card: DO NOT decrease Asset Account (Liability increase tracked dynamically)
        // - If NOT Credit Card: existing logic
        if (data.type === 'expense' && !data.creditCardId) {
            if (data.sourceAccountId) {
                // Decrease source (Cash/Bank)
                await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${data.sourceAccountId} AND user_id = ${userRecord.id}`);
            }
        } else if (data.type === 'income' && data.destinationAccountId) {
            // Increase destination
            await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${data.destinationAccountId} AND user_id = ${userRecord.id}`);
        } else if (data.type === 'transfer' && data.sourceAccountId && data.destinationAccountId) {
            // Transfer
            await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${data.sourceAccountId} AND user_id = ${userRecord.id}`);
            await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${data.destinationAccountId} AND user_id = ${userRecord.id}`);
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
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    // 1. Get transaction first to know amount and accounts
    const tx = await db.query.transactions.findFirst({
        where: and(eq(transactions.id, id), eq(transactions.userId, userRecord.id)),
    });

    if (!tx) return c.json({ error: 'Transaction not found' }, 404);

    // 2. Revert Balance Changes
    const amountInt = tx.amount;

    // Determine type based on accounts
    // Expense: source, !dest
    // Income: !source, dest
    // Transfer: source, dest

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
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    // 1. Get existing transaction
    const tx = await db.query.transactions.findFirst({
        where: and(eq(transactions.id, id), eq(transactions.userId, userRecord.id)),
    });

    if (!tx) return c.json({ error: 'Transaction not found' }, 404);

    const newAmountInt = Math.round(data.amount * 10000);

    try {
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
                await db.run(sql`UPDATE accounts SET balance = balance - ${newAmountInt} WHERE id = ${data.sourceAccountId} AND user_id = ${userRecord.id}`);
            }
        } else if (data.type === 'income' && data.destinationAccountId) {
            await db.run(sql`UPDATE accounts SET balance = balance + ${newAmountInt} WHERE id = ${data.destinationAccountId} AND user_id = ${userRecord.id}`);
        } else if (data.type === 'transfer' && data.sourceAccountId && data.destinationAccountId) {
            await db.run(sql`UPDATE accounts SET balance = balance - ${newAmountInt} WHERE id = ${data.sourceAccountId} AND user_id = ${userRecord.id}`);
            await db.run(sql`UPDATE accounts SET balance = balance + ${newAmountInt} WHERE id = ${data.destinationAccountId} AND user_id = ${userRecord.id}`);
        }

        // 4. Update Transaction Record
        // Handle Installment updates if necessary (skipping complex installment logic for Edit for now, assuming basic update)
        // If credit card changed, we might need to handle installment ID?
        // For simplicity v1: Update fields. If moving FROM credit card TO cash, installmentId should be nullified?
        // Let's keep it simple: just update the main fields.

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
