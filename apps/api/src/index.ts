import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from '@lin-fan/db';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/', (c) => {
    return c.json({ message: 'Hello from Hono!' });
});

app.get('/users', async (c) => {
    const db = createDb(c.env.DB);
    const result = await db.query.users.findMany();
    return c.json(result);
});

export type AppType = typeof app;

export default app;
