import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createDb, stocks, transactions, users, accounts } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

// Validator Schemas
const buyStockSchema = z.object({
    ticker: z.string().min(1).toUpperCase(),
    shares: z.number().positive(), // Real number (e.g., 1.5)
    price: z.number().positive(), // Real price per share (e.g., 150.00)
    date: z.string().transform(str => new Date(str)),
    sourceAccountId: z.number().int().positive(),
    description: z.string().optional(),
    ownerLabel: z.string().default('Self'),
});

const sellStockSchema = z.object({
    ticker: z.string().min(1).toUpperCase(),
    shares: z.number().positive(),
    price: z.number().positive(),
    date: z.string().transform(str => new Date(str)),
    destinationAccountId: z.number().int().positive(),
    description: z.string().optional(),
    ownerLabel: z.string().default('Self'),
});

// GET /api/stocks - List all holdings
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });

    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const holdings = await db.query.stocks.findMany({
        where: eq(stocks.userId, userRecord.id),
        orderBy: [desc(stocks.ownerLabel), desc(stocks.id)],
    });

    return c.json(holdings);
});

// POST /api/stocks/buy
app.post('/buy', zValidator('json', buyStockSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const data = c.req.valid('json');
    const ownerLabel = data.ownerLabel || 'Self';

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });
    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    // Scaling Factor: 10000
    const sharesInt = Math.round(data.shares * 10000);
    const priceInt = Math.round(data.price * 10000);
    const totalCostInt = Math.round((sharesInt * priceInt) / 10000);

    try {
        // 1. Deduct Cash
        const account = await db.query.accounts.findFirst({
            where: and(eq(accounts.id, data.sourceAccountId), eq(accounts.userId, userRecord.id))
        });

        if (!account) return c.json({ error: 'Source account not found' }, 404);
        if (account.balance < totalCostInt) return c.json({ error: 'Insufficient funds' }, 400);

        await db.run(sql`UPDATE accounts SET balance = balance - ${totalCostInt} WHERE id = ${data.sourceAccountId}`);

        // 2. Update/Create Stock Holding (Avg Cost Calculation)
        // Match ticker AND ownerLabel
        const existingStock = await db.query.stocks.findFirst({
            where: and(
                eq(stocks.userId, userRecord.id),
                eq(stocks.ticker, data.ticker),
                eq(stocks.ownerLabel, ownerLabel)
            ),
        });

        if (existingStock) {
            const oldTotalValue = Math.round((existingStock.shares * existingStock.avgCost) / 10000);
            const newTotalValue = oldTotalValue + totalCostInt;
            const newTotalShares = existingStock.shares + sharesInt;
            const newAvgCost = Math.round((newTotalValue * 10000) / newTotalShares);

            await db.update(stocks)
                .set({
                    shares: newTotalShares,
                    avgCost: newAvgCost,
                })
                .where(eq(stocks.id, existingStock.id));
        } else {
            await db.insert(stocks).values({
                userId: userRecord.id,
                ticker: data.ticker,
                shares: sharesInt,
                avgCost: priceInt,
                ownerLabel: ownerLabel,
            });
        }

        // 3. Record Transaction
        await db.insert(transactions).values({
            userId: userRecord.id,
            date: data.date,
            amount: totalCostInt,
            description: data.description || `Buy ${data.ticker}: ${data.shares} @ ${data.price} (${ownerLabel})`,
            sourceAccountId: data.sourceAccountId,
            createdAt: new Date(),
        });

        return c.json({ success: true, message: `Bought ${data.ticker} for ${ownerLabel}`, cost: totalCostInt });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// POST /api/stocks/sell
app.post('/sell', zValidator('json', sellStockSchema), async (c) => {
    const db = createDb(c.env.DB);
    const user = c.get('user');
    const data = c.req.valid('json');
    const ownerLabel = data.ownerLabel || 'Self';

    const userRecord = await db.query.users.findFirst({
        where: eq(users.firebaseUid, user.uid),
    });
    if (!userRecord) return c.json({ error: 'User not found' }, 404);

    const sharesInt = Math.round(data.shares * 10000);
    const priceInt = Math.round(data.price * 10000);
    const totalRevenueInt = Math.round((sharesInt * priceInt) / 10000);

    try {
        const existingStock = await db.query.stocks.findFirst({
            where: and(
                eq(stocks.userId, userRecord.id),
                eq(stocks.ticker, data.ticker),
                eq(stocks.ownerLabel, ownerLabel)
            ),
        });

        if (!existingStock || existingStock.shares < sharesInt) {
            return c.json({ error: 'Insufficient shares' }, 400);
        }

        // 1. Add Cash
        await db.run(sql`UPDATE accounts SET balance = balance + ${totalRevenueInt} WHERE id = ${data.destinationAccountId}`);

        // 2. Update Stock Holding
        const newShares = existingStock.shares - sharesInt;
        if (newShares === 0) {
            await db.delete(stocks).where(eq(stocks.id, existingStock.id));
        } else {
            // Avg Cost does NOT change on sell
            await db.update(stocks)
                .set({ shares: newShares })
                .where(eq(stocks.id, existingStock.id));
        }

        // 3. Record Transaction
        const costBasis = Math.round((sharesInt * existingStock.avgCost) / 10000);
        const realizedPnL = totalRevenueInt - costBasis;

        await db.insert(transactions).values({
            userId: userRecord.id,
            date: data.date,
            amount: totalRevenueInt,
            description: data.description || `Sell ${data.ticker}: ${data.shares} @ ${data.price} (${ownerLabel}) (PnL: ${realizedPnL / 10000})`,
            destinationAccountId: data.destinationAccountId,
            createdAt: new Date(),
        });

        return c.json({ success: true, message: `Sold ${data.ticker} for ${ownerLabel}`, revenue: totalRevenueInt, realizedPnL });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
