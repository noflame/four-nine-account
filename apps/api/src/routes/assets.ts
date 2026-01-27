import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { createDb, accounts } from '@lin-fan/db';
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
});

// GET /api/assets
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');

    if (!ledger) {
        return c.json({ error: 'Ledger context required' }, 403);
    }

    const result = await db.query.accounts.findMany({
        where: eq(accounts.ledgerId, ledger.id),
        with: {
            user: {
                columns: { name: true }
            }
        },
        orderBy: [desc(accounts.updatedAt)]
    });

    return c.json(result);
});

// POST /api/assets
app.post('/', zValidator('json', accountSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const ledger = c.get('ledger');
    const data = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot create assets' }, 403);

    const newAccount = await db.insert(accounts).values({
        userId: user.id,
        ledgerId: ledger.id,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: Math.round(data.balance * 10000), // Scale x10000
        updatedAt: new Date(),
    }).returning();

    return c.json(newAccount[0]);
});

// PATCH /api/assets/:id
app.patch('/:id', zValidator('json', accountSchema.partial()), async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot edit assets' }, 403);

    // Verify ownership/ledger scope
    const existingAccount = await db.query.accounts.findFirst({
        where: and(eq(accounts.id, id), eq(accounts.ledgerId, ledger.id))
    });

    if (!existingAccount) return c.json({ error: 'Account not found in this ledger' }, 404);

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
    const ledger = c.get('ledger');
    const id = parseInt(c.req.param('id'));

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot delete assets' }, 403);

    const result = await db.delete(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.ledgerId, ledger.id)))
        .returning();

    if (result.length === 0) return c.json({ error: 'Account not found in this ledger' }, 404);

    return c.json({ success: true, deletedId: id });
});

export default app;
