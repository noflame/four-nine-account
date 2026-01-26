import { Hono } from 'hono';
import { cors } from 'hono/cors';
import usersRoute from './routes/users';
import assetsRoute from './routes/assets';
import categoriesRoute from './routes/categories';
import transactionsRoute from './routes/transactions';
import cards_ from './routes/cards';
import dashboardRoute from './routes/dashboard';

import stocks_ from './routes/stocks';
import migration_ from './routes/migration';
import ledgers_ from './routes/ledgers';

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
    .route('/assets', assetsRoute)
    .route('/categories', categoriesRoute)
    .route('/transactions', transactionsRoute)
    .route('/api/cards', cards_)
    .route('/api/stocks', stocks_)
    .route('/api/migration', migration_)
    .route('/api/ledgers', ledgers_)
    .route('/dashboard', dashboardRoute);

export type AppType = typeof routes;

export default app;
