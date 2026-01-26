
import { Hono } from 'hono';
import { createDb } from '@lin-fan/db';
// @ts-ignore
import { migrateToLedgers } from '../../../../packages/db/src/migration-logic';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/run', async (c) => {
    const db = createDb(c.env.DB);
    try {
        await migrateToLedgers(db);
        return c.json({ success: true, message: "Migration completed" });
    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

export default app;
