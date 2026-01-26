import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { createDb, categories } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

// Default Seed Data
const DEFAULT_CATEGORIES = [
    // Expenses
    { name: 'Food', type: 'expense', icon: 'utensils' },
    { name: 'Transport', type: 'expense', icon: 'bus' },
    { name: 'Housing', type: 'expense', icon: 'home' },
    { name: 'Entertainment', type: 'expense', icon: 'gamepad-2' },
    { name: 'Shopping', type: 'expense', icon: 'shopping-bag' },
    { name: 'Health', type: 'expense', icon: 'heart-pulse' },
    { name: 'Education', type: 'expense', icon: 'graduation-cap' },
    // Income
    { name: 'Salary', type: 'income', icon: 'briefcase' },
    { name: 'Bonus', type: 'income', icon: 'gift' },
    { name: 'Investment', type: 'income', icon: 'trending-up' },
    { name: 'Other', type: 'income', icon: 'more-horizontal' },
] as const;

const categorySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['income', 'expense']),
    icon: z.string().optional(),
});

// GET /api/categories
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);

    const result = await db.select().from(categories).where(eq(categories.ledgerId, ledger.id)).all();
    return c.json(result);
});

// POST /api/categories
app.post('/', zValidator('json', categorySchema), async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const data = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot create categories' }, 403);

    try {
        const result = await db.insert(categories).values({
            ledgerId: ledger.id,
            name: data.name,
            type: data.type,
            icon: data.icon || 'more-horizontal', // Default icon
        }).returning();

        return c.json(result[0], 201);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/categories/seed
// Seed categories for the current ledger
app.post('/seed', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot seed categories' }, 403);

    try {
        // Check if categories already exist in this ledger
        const existing = await db.select().from(categories).where(eq(categories.ledgerId, ledger.id)).limit(1);
        if (existing.length > 0) {
            return c.json({ message: 'Categories already initialized for this ledger' });
        }

        const values = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            ledgerId: ledger.id,
            icon: cat.icon || 'more-horizontal'
        }));

        const result = await db.insert(categories).values(values).returning();
        return c.json({ message: 'Seeded successfully', count: result.length, data: result });
    } catch (e: any) {
        return c.json({ error: e.message || 'Unknown error during seeding' }, 500);
    }
});

// DELETE /api/categories/:id
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const id = parseInt(c.req.param('id'));

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot delete categories' }, 403);

    try {
        const result = await db.delete(categories).where(
            and(eq(categories.id, id), eq(categories.ledgerId, ledger.id))
        ).returning();

        if (result.length === 0) return c.json({ error: 'Category not found in this ledger' }, 404);

        return c.json({ success: true, deletedId: id });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
