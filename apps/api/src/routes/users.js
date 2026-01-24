import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, users } from '@lin-fan/db';
import { firebaseAuth } from '../middleware/auth';
// Create a new Hono instance for the users route
const app = new Hono();
app.use('*', firebaseAuth);
// Sync User (Login)
// POST /api/users/sync
app.post('/sync', async (c) => {
    const db = createDb(c.env.DB);
    const currentUser = c.get('user');
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.firebaseUid, currentUser.uid),
    });
    if (existingUser) {
        return c.json(existingUser);
    }
    // Create new user if not exists
    const newUser = await db.insert(users).values({
        name: currentUser.email?.split('@')[0] || 'New User',
        email: currentUser.email || '',
        firebaseUid: currentUser.uid,
        role: 'member', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();
    return c.json(newUser[0]);
});
// Get Current User Profile
// GET /api/users/me
app.get('/me', async (c) => {
    const db = createDb(c.env.DB);
    const currentUser = c.get('user');
    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, currentUser.uid),
    });
    if (!userRecord) {
        return c.json({ error: 'User not found' }, 404);
    }
    return c.json(userRecord);
});
export default app;
