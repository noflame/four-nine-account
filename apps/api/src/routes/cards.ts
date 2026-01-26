import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, sql, and, isNull, inArray } from 'drizzle-orm';
import { createDb, creditCards, transactions, accounts, users } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

// Validator Schemas
const createCardSchema = z.object({
    name: z.string().min(1),
    billingDay: z.number().min(1).max(31),
    paymentDay: z.number().min(1).max(31),
    creditLimit: z.number().nonnegative().optional().default(0), // Input as actual amount
});

const payCardSchema = z.object({
    sourceAccountId: z.number(),
    amount: z.number().positive(),
    date: z.string(), // ISO Date
});

// GET /api/cards
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);

    const cards = await db.select().from(creditCards).where(
        and(eq(creditCards.ledgerId, ledger.id), isNull(creditCards.deletedAt))
    ).all();

    const results = await Promise.all(cards.map(async (card) => {
        const txs = await db.select().from(transactions).where(eq(transactions.creditCardId, card.id)).all();

        let liability = 0;
        for (const tx of txs) {
            // Expense via Card
            if (!tx.sourceAccountId) {
                liability += tx.amount;
            } else {
                // Payment
                liability -= tx.amount;
            }
        }

        return {
            ...card,
            balance: liability
        };
    }));

    return c.json(results);
});

// POST /api/cards
app.post('/', zValidator('json', createCardSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const ledger = c.get('ledger');
    const body = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot create cards' }, 403);

    try {
        const result = await db.insert(creditCards).values({
            userId: user.id,
            ledgerId: ledger.id,
            name: body.name,
            billingDay: body.billingDay,
            paymentDay: body.paymentDay,
            creditLimit: Math.round(body.creditLimit * 10000),
        }).returning();

        return c.json(result[0], 201);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// PUT /api/cards/:id
app.put('/:id', zValidator('json', createCardSchema), async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const cardId = parseInt(c.req.param('id'));
    const body = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot edit cards' }, 403);

    try {
        // Verify ownership
        const existingCard = await db.query.creditCards.findFirst({
            where: and(eq(creditCards.id, cardId), eq(creditCards.ledgerId, ledger.id))
        });

        if (!existingCard) return c.json({ error: 'Card not found in this ledger' }, 404);

        const result = await db.update(creditCards)
            .set({
                name: body.name,
                billingDay: body.billingDay,
                paymentDay: body.paymentDay,
                creditLimit: Math.round(body.creditLimit * 10000),
            })
            .where(eq(creditCards.id, cardId))
            .returning();

        return c.json(result[0]);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/cards/:id
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const ledger = c.get('ledger');
    const cardId = parseInt(c.req.param('id'));

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot delete cards' }, 403);

    try {
        const card = await db.query.creditCards.findFirst({
            where: and(eq(creditCards.id, cardId), eq(creditCards.ledgerId, ledger.id))
        });

        if (!card) return c.json({ error: 'Card not found' }, 404);

        // Check Balance
        const txs = await db.select().from(transactions).where(eq(transactions.creditCardId, cardId)).all();
        let liability = 0;
        for (const tx of txs) {
            if (!tx.sourceAccountId) {
                liability += tx.amount;
            } else {
                liability -= tx.amount;
            }
        }

        if (liability > 0) {
            return c.json({ error: 'Card has outstanding balance. Please pay off first.' }, 400);
        }

        // Soft Delete
        await db.update(creditCards)
            .set({ deletedAt: new Date() })
            .where(eq(creditCards.id, cardId));

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/cards/:id/pay
app.post('/:id/pay', zValidator('json', payCardSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const ledger = c.get('ledger');
    const cardId = parseInt(c.req.param('id'));
    const body = c.req.valid('json');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);
    if (ledger.role === 'viewer') return c.json({ error: 'Viewers cannot pay cards' }, 403);

    try {
        // 1. Check source account in SAME Ledger
        const sourceAccount = await db.query.accounts.findFirst({
            where: and(eq(accounts.id, body.sourceAccountId), eq(accounts.ledgerId, ledger.id))
        });

        if (!sourceAccount) return c.json({ error: 'Source account not found in this ledger' }, 404);

        if (sourceAccount.balance < body.amount) {
            return c.json({ error: 'Insufficient funds in source account' }, 400);
        }

        // 2. Create Transaction (Payment)
        await db.insert(transactions).values({
            userId: user.id,
            ledgerId: ledger.id,
            date: new Date(body.date),
            amount: body.amount,
            description: `Payment for credit card #${cardId}`,
            sourceAccountId: body.sourceAccountId,
            creditCardId: cardId, // Link to card
            createdAt: new Date(),
        });

        // 3. Update Asset Account Balance
        await db.update(accounts)
            .set({
                balance: sql`${accounts.balance} - ${body.amount}`,
                updatedAt: new Date()
            })
            .where(eq(accounts.id, body.sourceAccountId));

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
