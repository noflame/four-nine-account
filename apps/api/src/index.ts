import { Hono } from 'hono';
import { cors } from 'hono/cors';
import usersRoute from './routes/users';
import assetsRoute from './routes/assets';
import categoriesRoute from './routes/categories';
import transactionsRoute from './routes/transactions';
import cardsRoute from './routes/cards';
import dashboardRoute from './routes/dashboard';

import stocksRoute from './routes/stocks';

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
    .route('/cards', cardsRoute)
    .route('/stocks', stocksRoute)
    .route('/dashboard', dashboardRoute);

export type AppType = typeof routes;

export default app;
