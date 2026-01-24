import { Hono } from 'hono';
import { cors } from 'hono/cors';
import usersRoute from './routes/users';
import assetsRoute from './routes/assets';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/', (c) => {
    return c.json({ message: 'Hello from Hono!' });
});

const routes = app
    .route('/users', usersRoute)
    .route('/assets', assetsRoute);

export type AppType = typeof routes;

export default app;
