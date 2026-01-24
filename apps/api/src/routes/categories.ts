import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
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
    const result = await db.select().from(categories).all();
    return c.json(result);
});

// POST /api/categories
app.post('/', zValidator('json', categorySchema), async (c) => {
    const db = createDb(c.env.DB);
    const data = c.req.valid('json');

    try {
        const result = await db.insert(categories).values({
            name: data.name,
            type: data.type,
            icon: data.icon || 'more-horizontal', // Default icon
        }).returning();

        return c.json(result[0], 201);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/categories/:id
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const id = parseInt(c.req.param('id'));

    try {
        // TODO: Check if category is used in transactions before deleting?
        // For now, allow deletion but transactions will lose category association (become null or invalid reference if not cascaded)
        // With current schema, transaction.categoryId is nullable foreign key if configured, 
        // effectively transactions will keep the ID but join will fail or generic handling.

        await db.delete(categories).where(eq(categories.id, id));
        return c.json({ success: true, deletedId: id });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/categories/seed
// Helper endpoint to initialize default categories
app.post('/seed', async (c) => {
    const db = createDb(c.env.DB);

    // Check if categories already exist
    const existing = await db.select().from(categories).limit(1);
    if (existing.length > 0) {
        return c.json({ message: 'Categories already initialized' });
    }

    const result = await db.insert(categories).values(DEFAULT_CATEGORIES as any).returning();
    return c.json({ message: 'Seeded successfully', count: result.length, data: result });
});

export default app;
