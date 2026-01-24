import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createDb, transactions, users } from '@lin-fan/db';
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
    categoryId: z.number().optional(),
    sourceAccountId: z.number().optional(),
    destinationAccountId: z.number().optional(),
}).refine(data => {
    if (data.type === 'expense' && !data.sourceAccountId) return false;
    if (data.type === 'income' && !data.destinationAccountId) return false;
    if (data.type === 'transfer' && (!data.sourceAccountId || !data.destinationAccountId)) return false;
    return true;
}, {
    message: "Missing required account for the selected transaction type",
    path: ["sourceAccountId", "destinationAccountId"]
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
        }
    });

    return c.json(result);
});

// POST /api/transactions
app.post('/', zValidator('json', transactionSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const amountInt = Math.round(data.amount * 10000);

    // Use transaction to ensure data integrity
    try {
        // Since D1/Drizzle transaction support might vary, we implement logical checks
        // Ideally: await db.transaction(async (tx) => { ... })
        // For now, we proceed with sequential updates. 
        // TODO: Ensure strict transaction safety when D1 stabilizes.

        // 1. Create Transaction Record
        const newTransaction = await db.insert(transactions).values({
            userId: userRecord.id,
            date: data.date,
            amount: amountInt,
            description: data.description,
            categoryId: data.categoryId,
            sourceAccountId: data.sourceAccountId,
            destinationAccountId: data.destinationAccountId,
            createdAt: new Date(),
        }).returning();

        // 2. Update Account Balances
        if (data.type === 'expense' && data.sourceAccountId) {
            // Decrease source
            await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${data.sourceAccountId} AND user_id = ${userRecord.id}`);
        } else if (data.type === 'income' && data.destinationAccountId) {
            // Increase destination
            await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${data.destinationAccountId} AND user_id = ${userRecord.id}`);
        } else if (data.type === 'transfer' && data.sourceAccountId && data.destinationAccountId) {
            // Decrease source
            await db.run(sql`UPDATE accounts SET balance = balance - ${amountInt} WHERE id = ${data.sourceAccountId} AND user_id = ${userRecord.id}`);
            // Increase destination
            await db.run(sql`UPDATE accounts SET balance = balance + ${amountInt} WHERE id = ${data.destinationAccountId} AND user_id = ${userRecord.id}`);
        }

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

export default app;
