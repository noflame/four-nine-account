import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { createDb, families, users } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

function generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// POST /api/family/create
app.post('/create', zValidator('json', z.object({
    name: z.string().min(1)
})), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const { name } = c.req.valid('json');

    if (user.familyId) {
        return c.json({ error: 'User already in a family' }, 400);
    }

    try {
        // Create Family
        const inviteCode = generateInviteCode();
        const [newFamily] = await db.insert(families).values({
            name,
            inviteCode,
            createdAt: new Date(),
        }).returning();

        // Update User
        await db.update(users)
            .set({ familyId: newFamily.id, role: 'admin' }) // Creator becomes admin
            .where(eq(users.id, user.id));

        return c.json(newFamily);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/family/join
app.post('/join', zValidator('json', z.object({
    inviteCode: z.string().length(6)
})), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const { inviteCode } = c.req.valid('json');

    if (user.familyId) {
        return c.json({ error: 'User already in a family' }, 400);
    }

    try {
        // Find Family
        const family = await db.query.families.findFirst({
            where: eq(families.inviteCode, inviteCode)
        });

        if (!family) {
            return c.json({ error: 'Invalid invite code' }, 404);
        }

        // Update User
        await db.update(users)
            .set({ familyId: family.id, role: 'member' })
            .where(eq(users.id, user.id));

        return c.json(family);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// GET /api/family/members
app.get('/members', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');

    if (!user.familyId) {
        return c.json([]); // Not in a family
    }

    const members = await db.query.users.findMany({
        where: eq(users.familyId, user.familyId),
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            // Don't leak firebaseUid
        }
    });

    // Also return family info
    const family = await db.query.families.findFirst({
        where: eq(families.id, user.familyId)
    });

    // Handle orphaned users (familyId exists but family record deleted/missing)
    if (!family) {
        // Auto-fix: Clear familyId if family doesn't exist
        await db.update(users).set({ familyId: null, role: 'member' }).where(eq(users.id, user.id));
        return c.json({ family: null, members: [] });
    }

    return c.json({
        family,
        members
    });
});

// POST /api/family/leave
app.post('/leave', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');

    if (!user.familyId) {
        return c.json({ error: 'Not in a family' }, 400);
    }

    try {
        await db.update(users)
            .set({ familyId: null, role: 'member' })
            .where(eq(users.id, user.id));

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/family/member/:id
app.delete('/member/:id', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const targetUserId = parseInt(c.req.param('id'));

    if (!user.familyId) return c.json({ error: 'Not in a family' }, 400);
    if (user.role !== 'admin') return c.json({ error: 'Only admin can remove members' }, 403);

    // Can't remove self using this endpoint (use /leave if implemented)
    if (targetUserId === user.id) return c.json({ error: 'Cannot remove self' }, 400);

    try {
        // Verify target user is in same family
        const targetUser = await db.query.users.findFirst({
            where: and(eq(users.id, targetUserId), eq(users.familyId, user.familyId))
        });

        if (!targetUser) return c.json({ error: 'Member not found in your family' }, 404);

        // Remove from family
        await db.update(users)
            .set({ familyId: null, role: 'member' }) // Reset to member? Or keep as is?
            .where(eq(users.id, targetUserId));

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
