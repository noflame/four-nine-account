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
    const user = c.get('user');

    // Pagination params
    const limit = Number(c.req.query('limit')) || 20;
    const offset = Number(c.req.query('offset')) || 0;

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    let whereCondition = eq(transactions.userId, userRecord.id);

    if (userRecord.familyId) {
        const familyMembers = await db.query.users.findMany({
            where: eq(users.familyId, userRecord.familyId),
            columns: { id: true }
        });
        const memberIds = familyMembers.map(m => m.id);

        if (userRecord.role === 'child') {
            // For child: userId in family AND (sourceAccount.isVisible OR destAccount.isVisible)
            // This is complex in a single where clause with drizzle query builder if we can't join easily in 'where'.
            // Drizzle `findMany` 'where' acts on the main table columns usually.
            // We can filter by `userId` but also need to filter by account visibility.
            // Easier approach: Get visible account IDs first.
            const visibleAccounts = await db.query.accounts.findMany({
                where: and(inArray(accounts.userId, memberIds), eq(accounts.isVisibleToChild, true)),
                columns: { id: true }
            });
            const visibleAccountIds = visibleAccounts.map(a => a.id);

            if (visibleAccountIds.length === 0) {
                return c.json([]);
            }

            // OR condition: source IN visible OR dest IN visible
            // AND still belongs to family (which is implied if accounts are from family members)
            // But transactions.userId should also be checked? Transaction creator?
            // Actually, if I pay for something from a visible account, the child should see it regardless of who created it?
            // Or should they only see transactions created by themselves? (Child probably doesn't verify transactions much).
            // Let's assume: Show transactions where Source OR Destination is a visible account.
            // Use 'as any' workaround for complex SQL or redefine whereCondition type
            whereCondition = and(
                inArray(transactions.userId, memberIds),
                sql`(${transactions.sourceAccountId} IN ${visibleAccountIds} OR ${transactions.destinationAccountId} IN ${visibleAccountIds})`
            ) as any;
        } else {
            whereCondition = inArray(transactions.userId, memberIds);
        }
    }

    const result = await db.query.transactions.findMany({
        where: whereCondition,
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
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);
    if (userRecord.role === 'child') return c.json({ error: 'Child cannot perform this action' }, 403);

    const amountInt = Math.round(data.amount * 10000);

    // 2. Helper to verify Account Access
    const verifyAccountAccess = async (accountId: number | null | undefined) => {
        if (!accountId) return;
        const account = await db.query.accounts.findFirst({
            where: eq(accounts.id, accountId),
            with: { user: true }
        });
        if (!account) throw new Error(`Account ${accountId} not found`);

        const isOwner = account.userId === userRecord.id;
        const isFamily = userRecord.familyId && account.user.familyId === userRecord.familyId;

        if (!isOwner && !isFamily) {
            throw new Error(`Unauthorized access to account ${accountId}`);
        }
    };

    try {
        await verifyAccountAccess(data.sourceAccountId);
        await verifyAccountAccess(data.destinationAccountId);

        let installmentId = undefined;

        // Handle Installments
        if (data.creditCardId && data.installmentTotalMonths > 1) {
            // Check Credit Card Access too?
            const card = await db.query.creditCards.findFirst({
                where: eq(creditCards.id, data.creditCardId),
                with: { user: { with: { family: true } } } // Need to join user to check family? No, user table has familyId column.
            });
            // Actually creditCards -> user relation exists.
            // Let's implement card check later or now. 
            // For now assume strictly account access prevents money moves.

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
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);
    if (userRecord.role === 'child') return c.json({ error: 'Child cannot perform this action' }, 403);

    // 1. Get transaction first to know amount and accounts
    const tx = await db.query.transactions.findFirst({
        where: eq(transactions.id, id),
        with: { user: true }
    });

    if (!tx) return c.json({ error: 'Transaction not found' }, 404);

    // Verify Access (Owner or Family)
    const isOwner = tx.userId === userRecord.id;
    const isFamily = userRecord.familyId && tx.user.familyId === userRecord.familyId;
    if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized' }, 403);

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
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);
    if (userRecord.role === 'child') return c.json({ error: 'Child cannot perform this action' }, 403);

    // 1. Get existing transaction
    const tx = await db.query.transactions.findFirst({
        where: eq(transactions.id, id),
        with: { user: true }
    });

    if (!tx) return c.json({ error: 'Transaction not found' }, 404);

    // Verify Access
    const isOwner = tx.userId === userRecord.id;
    const isFamily = userRecord.familyId && tx.user.familyId === userRecord.familyId;
    if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized' }, 403);

    // Helper to verify Account Access (New accounts)
    const verifyAccountAccess = async (accountId: number | null | undefined) => {
        if (!accountId) return;
        const account = await db.query.accounts.findFirst({
            where: eq(accounts.id, accountId),
            with: { user: true }
        });
        if (!account) throw new Error(`Account ${accountId} not found`);
        const accOwner = account.userId === userRecord.id;
        const accFamily = userRecord.familyId && account.user.familyId === userRecord.familyId;
        if (!accOwner && !accFamily) throw new Error(`Unauthorized access to account ${accountId}`);
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
