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
// List all cards with current liability balance
// GET /api/cards
// List all cards with current liability balance
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);
    if (userRecord.role === 'child') return c.json([]); // Child cannot see cards

    // Fetch cards (only active ones)
    let whereCondition = and(eq(creditCards.userId, userRecord.id), isNull(creditCards.deletedAt));

    if (userRecord.familyId) {
        const familyMembers = await db.query.users.findMany({
            where: eq(users.familyId, userRecord.familyId),
            columns: { id: true }
        });
        const memberIds = familyMembers.map(m => m.id);
        whereCondition = and(inArray(creditCards.userId, memberIds), isNull(creditCards.deletedAt));
    }

    const cards = await db.select().from(creditCards).where(whereCondition).all();

    // Calculate balance for each card
    // Balance = Sum of transactions where creditCardId = card.id AND amount > 0 (expenses increase liability)
    // Wait, transactions table amount is always positive. 
    // Logic: Expenses (creditCardId set) INCREASE liability.
    // Payments (transfer from Account -> Card?) No, payments usually are handled separately.
    // Let's assume for now "Pay Off" actions create a transaction that reduces liability?
    // OR we just query SUM(amount) of all transactions linked to creditCardId.
    // When we pay off a card, we might create a transaction with negative amount? 
    // BUT transactions.amount is 'always positive' in schema comments (usually).
    // Let's refine the logic:
    // Expense via Card: Transaction { creditCardId: X, amount: 1000 } => Liability +1000
    // Payment of Card: Transaction { creditCardId: X, amount: -1000?? } 
    // Schema said "amount: integer('amount').notNull(), // x10000, always positive".
    // So we need a way to distinguish Expense vs Payment on a card.
    // Usually "Payment" is a transfer from Bank -> Card.
    // In our system, maybe we can use Category? Or simply `destinationAccountId` logic?
    // Implementation Plan said: "POST /:id/pay: Pay off card balance (transfer from Asset Account -> Credit Card)"

    // Let's implement calculate balance properly later. For now, just sum all transactions linked to card.

    const results = await Promise.all(cards.map(async (card) => {
        // This is a simplified balance calculation. 
        // Real world needs to handle statements, but for now sum all un-reconciled transactions?
        // Let's just sum ALL transactions for now.
        // We need a way to mark transactions as "Paid".
        // For v1, let's assume balance is sum of all transactions linked to this card.
        // And "Payment" reduces this balance?
        // We need a special transaction type OR look for Transfers where destination is this card?
        // Setting `destinationAccountId` = Card? No, Card is not in `accounts` table.

        // Let's fetch all transactions for this card
        const txs = await db.select().from(transactions).where(eq(transactions.creditCardId, card.id)).all();

        // Expense: creditCardId present, sourceAccountId NULL?
        // Payment: We need to design how Payment looks.
        // A Payment is a transaction where we pay the card company. 
        // From user perspective: Asset Account (Bank) -> Virtual destination (Card Company).
        // If we link it to creditCardId, we can say:
        // IF creditCardId is present:
        //    IF sourceAccountId is NULL => Expense (Liability +)
        //    IF sourceAccountId is NOT NULL (and maybe special category?) => Payment (Liability -)

        let liability = 0;
        for (const tx of txs) {
            // If it's an expense charged to card
            if (!tx.sourceAccountId) {
                liability += tx.amount;
            } else {
                // It's a payment FROM an account TO this card
                // Using sourceAccountId + creditCardId implies payment
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
    const body = c.req.valid('json');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);
    if (userRecord.role === 'child') return c.json({ error: 'Child cannot perform this action' }, 403);

    try {
        const result = await db.insert(creditCards).values({
            userId: userRecord.id, // Use userRecord.id
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
    const userId = c.get('user').id;
    const cardId = parseInt(c.req.param('id'));
    const body = c.req.valid('json');

    try {
        const userRecord = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!userRecord) return c.json({ error: 'User not found' }, 404);

        // Verify ownership
        const existingCard = await db.query.creditCards.findFirst({
            where: eq(creditCards.id, cardId),
            with: { user: true }
        });

        if (!existingCard) return c.json({ error: 'Card not found' }, 404);

        const isOwner = existingCard.userId === userId;
        const isFamily = userRecord.familyId && existingCard.user.familyId === userRecord.familyId;
        if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized' }, 403);

        const result = await db.update(creditCards)
            .set({
                name: body.name,
                billingDay: body.billingDay,
                paymentDay: body.paymentDay,
                creditLimit: Math.round(body.creditLimit * 10000),
            })
            .where(eq(creditCards.id, cardId))
            .returning();

        if (result.length === 0) {
            return c.json({ error: 'Card not found' }, 404);
        }

        return c.json(result[0]);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/cards/:id
// Soft delete card if balance is 0
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const userId = c.get('user').id;
    const cardId = parseInt(c.req.param('id'));

    const userRecord = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    try {
        // 1. Get Card
        const card = await db.query.creditCards.findFirst({
            where: eq(creditCards.id, cardId),
            with: { user: true }
        });

        if (!card) return c.json({ error: 'Card not found' }, 404);

        const isOwner = card.userId === userId;
        const isFamily = userRecord.familyId && card.user.familyId === userRecord.familyId;
        if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized' }, 403);

        // 2. Check Balance
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

        // 3. Soft Delete
        await db.update(creditCards)
            .set({ deletedAt: new Date() })
            .where(eq(creditCards.id, cardId));

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/cards/:id/pay
// Pay off card balance
app.post('/:id/pay', zValidator('json', payCardSchema), async (c) => {
    const db = createDb(c.env.DB);
    const userId = c.get('user').id;
    const cardId = parseInt(c.req.param('id'));
    const body = c.req.valid('json');

    try {
        // 1. Check source account balance and permission
        const sourceAccount = await db.query.accounts.findFirst({
            where: eq(accounts.id, body.sourceAccountId),
            with: { user: true }
        });

        if (!sourceAccount) return c.json({ error: 'Source account not found' }, 404);

        const userRecord = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!userRecord) return c.json({ error: 'User not found' }, 404);

        // Verify Access to Source Account
        const isOwner = sourceAccount.userId === userId;
        const isFamily = userRecord.familyId && sourceAccount.user.familyId === userRecord.familyId;
        if (!isOwner && !isFamily) return c.json({ error: 'Unauthorized access to source account' }, 403);

        if (sourceAccount.balance < body.amount) {
            return c.json({ error: 'Insufficient funds in source account' }, 400);
        }

        // 2. Create Transaction (Payment)
        // Source = Bank, CreditCard = Target, Amount = X
        // This transaction represents the payment.
        await db.insert(transactions).values({
            userId,
            date: new Date(body.date),
            amount: body.amount,
            description: `Payment for credit card #${cardId}`,
            sourceAccountId: body.sourceAccountId,
            creditCardId: cardId, // Link to card to reduce liability
            // No destinationAccountId because money leaves the asset system (goes to bank)
            // But from "Net Worth" perspective, assets decrease, liabilities decrease, so Net Worth stays same.
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
