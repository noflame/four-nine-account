import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { createDb, accounts, users } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

// Schema Validator
const accountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['cash', 'bank', 'digital']),
    currency: z.string().default('TWD'),
    balance: z.number(), // Input is actual value (e.g. 100), backend converts to x10000
    isVisibleToChild: z.boolean().default(false),
});

// GET /api/assets
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');

    // Get internal user ID first
    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const result = await db.query.accounts.findMany({
        where: eq(accounts.userId, userRecord.id),
    });

    return c.json(result);
});

// POST /api/assets
app.post('/', zValidator('json', accountSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const newAccount = await db.insert(accounts).values({
        userId: userRecord.id,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: Math.round(data.balance * 10000), // Scale x10000
        isVisibleToChild: data.isVisibleToChild,
        updatedAt: new Date(),
    }).returning();

    return c.json(newAccount[0]);
});

// PATCH /api/assets/:id
app.patch('/:id', zValidator('json', accountSchema.partial()), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    // Verify ownership
    const existingAccount = await db.query.accounts.findFirst({
        where: and(eq(accounts.id, id), eq(accounts.userId, userRecord.id)),
    });

    if (!existingAccount) return c.json({ error: 'Account not found' }, 404);

    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.balance !== undefined) {
        updateData.balance = Math.round(data.balance * 10000);
    }

    const updatedAccount = await db.update(accounts)
        .set(updateData)
        .where(eq(accounts.id, id))
        .returning();

    return c.json(updatedAccount[0]);
});

// DELETE /api/assets/:id
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    // Verify ownership
    const result = await db.delete(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userRecord.id)))
        .returning();

    if (result.length === 0) return c.json({ error: 'Account not found' }, 404);

    return c.json({ success: true, deletedId: id });
});

export default app;
