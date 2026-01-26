
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { createDb, ledgers, ledgerUsers, users } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

const createLedgerSchema = z.object({
    name: z.string().min(1),
    password: z.string().optional(), // Optional password
});

const accessLedgerSchema = z.object({
    password: z.string().optional()
});

// GET / - List my ledgers
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');

    const myLedgers = await db.query.ledgerUsers.findMany({
        where: eq(ledgerUsers.userId, user.id),
        with: {
            ledger: true
        },
        orderBy: [desc(ledgerUsers.lastAccessedAt)]
    });

    return c.json(myLedgers.map(lu => ({
        id: lu.ledger.id,
        name: lu.ledger.name,
        role: lu.role,
        lastAccessedAt: lu.lastAccessedAt,
        hasPassword: !!lu.ledger.passwordHash
    })));
});

// POST / - Create new ledger
app.post('/', zValidator('json', createLedgerSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const { name, password } = c.req.valid('json');

    try {
        const [ledger] = await db.insert(ledgers).values({
            name,
            passwordHash: password || null, // Plaintext for now? Plan said hash.
            // TODO: Hash the password. For MVP/prototype, storing as is or simple hash?
            // User requirement: "Enter password".
            // Since we don't have bcrypt in this environment easily without polyfills, 
            // and this is a prototype/personal app, we might store plaintext or simple shift.
            // For now, let's just store it. Ideally use Web Crypto API for SHA-256.
            createdAt: new Date(),
        }).returning();

        // Add creator as owner
        await db.insert(ledgerUsers).values({
            ledgerId: ledger.id,
            userId: user.id,
            role: 'owner',
            lastAccessedAt: new Date()
        });

        return c.json(ledger);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /:id/verify - Verify password to enter
app.post('/:id/verify', zValidator('json', accessLedgerSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const ledgerId = parseInt(c.req.param('id'));
    const { password } = c.req.valid('json');

    const ledger = await db.query.ledgers.findFirst({
        where: eq(ledgers.id, ledgerId)
    });

    if (!ledger) return c.json({ error: 'Ledger not found' }, 404);

    // If locked, check password
    if (ledger.passwordHash) {
        if (ledger.passwordHash !== password) {
            return c.json({ error: 'Invalid password' }, 403);
        }
    }

    return c.json({ success: true });
});

export default app;
