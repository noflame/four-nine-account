import { Hono } from 'hono';
import { cors } from 'hono/cors';
import usersRoute from './routes/users';
const app = new Hono();
app.use('*', cors());
app.get('/', (c) => {
    return c.json({ message: 'Hello from Hono!' });
});
const routes = app.route('/users', usersRoute);
export default app;
