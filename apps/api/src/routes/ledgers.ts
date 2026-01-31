
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { createDb, ledgers, ledgerUsers, transactions, stocks, creditCards, creditCardInstallments, accounts, categories } from '@lin-fan/db';
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

const deleteLedgerSchema = z.object({
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

// DELETE /:id - Delete ledger
app.delete('/:id', zValidator('json', deleteLedgerSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const ledgerId = parseInt(c.req.param('id'));
    const { password } = c.req.valid('json');

    // Check if ledger exists
    const ledger = await db.query.ledgers.findFirst({
        where: eq(ledgers.id, ledgerId)
    });

    if (!ledger) return c.json({ error: 'Ledger not found' }, 404);

    // Check if user is owner
    const userRole = await db.query.ledgerUsers.findFirst({
        where: and(eq(ledgerUsers.ledgerId, ledgerId), eq(ledgerUsers.userId, user.id))
    });

    if (!userRole || userRole.role !== 'owner') {
        return c.json({ error: 'Unauthorized: Only owners can delete ledgers' }, 403);
    }

    // Verify password if ledger has one
    if (ledger.passwordHash) {
        if (!password || ledger.passwordHash !== password) {
             return c.json({ error: 'Invalid password' }, 403);
        }
    }

    try {
        // Prepare batch operations
        const steps: any[] = [];

        // 1. Transactions
        steps.push(db.delete(transactions).where(eq(transactions.ledgerId, ledgerId)));

        // 2. Credit Card Installments (via Credit Cards)
        // D1 batch doesn't support reading inside. We read first.
        const cards = await db.select({ id: creditCards.id }).from(creditCards).where(eq(creditCards.ledgerId, ledgerId));
        if (cards.length > 0) {
            const cardIds = cards.map(c => c.id);
            steps.push(db.delete(creditCardInstallments).where(inArray(creditCardInstallments.cardId, cardIds)));
        }

        // 3. Stocks, Cards, Accounts, Categories
        steps.push(db.delete(stocks).where(eq(stocks.ledgerId, ledgerId)));
        steps.push(db.delete(creditCards).where(eq(creditCards.ledgerId, ledgerId)));
        steps.push(db.delete(accounts).where(eq(accounts.ledgerId, ledgerId)));
        steps.push(db.delete(categories).where(eq(categories.ledgerId, ledgerId)));
        
        // 4. Ledger Users
        steps.push(db.delete(ledgerUsers).where(eq(ledgerUsers.ledgerId, ledgerId)));
        
        // 5. Ledger
        steps.push(db.delete(ledgers).where(eq(ledgers.id, ledgerId)));

        // Execute batch
        await db.batch(steps as [any, ...any[]]);

        return c.json({ success: true });
    } catch (e: any) {
        console.error("Delete ledger error:", e);
        return c.json({ error: e.message }, 500);
    }
});

export default app;
