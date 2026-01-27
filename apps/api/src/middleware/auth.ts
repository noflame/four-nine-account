import { createMiddleware } from 'hono/factory';
import { decode } from 'hono/jwt';
import { createDb, users } from '@lin-fan/db';
import * as schema from '@lin-fan/db'; // Need full schema for relations
import { eq, and } from 'drizzle-orm';

// Define the custom context variable for User
export type AuthVariables = {
    user: {
        id: number;
        uid: string;
        email?: string;
    };
    ledger?: {
        id: number;
        role: 'owner' | 'editor' | 'viewer';
        name: string;
    };
    // Helper to get D1 Database (inferred from index.ts usually, but good to have)
    DB: D1Database;
};

export const firebaseAuth = createMiddleware<{ Bindings: { DB: D1Database }; Variables: AuthVariables }>(async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        // In a real Worker environment, we would verify the signature using Google's public keys.
        // For now, we will decode the token to get the UID (Development Mode).
        // TODO: Implement full JWK signature verification.
        const { payload } = decode(token);

        if (!payload.sub) {
            throw new Error('Invalid token');
        }

        const uid = payload.sub as string;
        const email = payload.email as string | undefined;

        // Lookup user in DB to get ID
        const db = createDb(c.env.DB);
        let user = await db.select().from(users).where(eq(users.firebaseUid, uid)).get();

        if (!user) {
            // Auto-create user if not found (First login hook)
            // Or return 401? For now, auto-create to ensure smoother UX
            if (!email) throw new Error('Email required for new user');

            const [newUser] = await db.insert(users).values({
                name: email.split('@')[0], // Default name
                email: email,
                firebaseUid: uid,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();
            user = newUser;
        }

        if (user) {
            c.set('user', {
                id: user.id,
                uid: uid,
                email: email,
            });

            // Handle Ledger Context
            const ledgerIdHeader = c.req.header('X-Ledger-Id');
            if (ledgerIdHeader) {
                const ledgerId = parseInt(ledgerIdHeader);
                if (!isNaN(ledgerId)) {
                    // Check membership
                    const membership = await db.query.ledgerUsers.findFirst({
                        where: and(
                            eq(schema.ledgerUsers.userId, user.id),
                            eq(schema.ledgerUsers.ledgerId, ledgerId)
                        ),
                        with: {
                            ledger: true
                        }
                    });

                    if (membership) {
                        c.set('ledger', {
                            id: membership.ledgerId,
                            role: membership.role,
                            name: membership.ledger.name
                        });

                        // Update last accessed
                        // Fire and forget update
                        c.executionCtx.waitUntil(
                            db.update(schema.ledgerUsers)
                                .set({ lastAccessedAt: new Date() })
                                .where(and(
                                    eq(schema.ledgerUsers.userId, user.id),
                                    eq(schema.ledgerUsers.ledgerId, ledgerId)
                                ))
                                .run()
                        );
                    } else {
                        // Provided Ledger ID but no membership -> 403 Forbidden
                        return c.json({ error: 'Access to this ledger denied' }, 403);
                    }
                }
            }
        }

        await next();
    } catch (err) {
        console.error('Auth Error:', err);
        return c.json({ error: 'Invalid token' }, 401);
    }
});
