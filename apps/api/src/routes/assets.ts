import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, inArray } from 'drizzle-orm';
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

    // Check child role
    let result;
    if (userRecord.familyId) {
        const familyMembers = await db.query.users.findMany({
            where: eq(users.familyId, userRecord.familyId),
            columns: { id: true }
        });
        const memberIds = familyMembers.map(m => m.id);

        let whereClause;
        if (userRecord.role === 'child') {
            // Child: Only isVisibleToChild accounts in the family
            whereClause = and(inArray(accounts.userId, memberIds), eq(accounts.isVisibleToChild, true));
        } else {
            // Member/Admin: All family accounts
            whereClause = inArray(accounts.userId, memberIds);
        }

        result = await db.query.accounts.findMany({
            where: whereClause,
            with: {
                user: {
                    columns: { name: true }
                }
            }
        });
    } else {
        // Independent user
        result = await db.query.accounts.findMany({
            where: eq(accounts.userId, userRecord.id),
            with: {
                user: {
                    columns: { name: true }
                }
            }
        });
    }

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
    if (userRecord.role === 'child') return c.json({ error: 'Child accounts cannot perform this action' }, 403);

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
        where: eq(accounts.id, id),
        with: { user: true }
    });

    if (!existingAccount) return c.json({ error: 'Account not found' }, 404);

    const isOwner = existingAccount.userId === userRecord.id;
    const isFamily = userRecord.familyId && existingAccount.user.familyId === userRecord.familyId;
    if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized' }, 403);

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
    const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.id, id),
        with: { user: true }
    });

    if (!existingAccount) return c.json({ error: 'Account not found' }, 404);

    const isOwner = existingAccount.userId === userRecord.id;
    const isFamily = userRecord.familyId && existingAccount.user.familyId === userRecord.familyId;
    if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized' }, 403);

    const result = await db.delete(accounts)
        .where(eq(accounts.id, id))
        .returning();

    if (result.length === 0) return c.json({ error: 'Account not found' }, 404);

    return c.json({ success: true, deletedId: id });
});

export default app;
