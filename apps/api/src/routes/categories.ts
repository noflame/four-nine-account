import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
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

// GET /api/categories
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const result = await db.select().from(categories).all();
    return c.json(result);
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
