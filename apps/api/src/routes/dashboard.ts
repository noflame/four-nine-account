import { Hono } from 'hono';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { createDb, creditCards, transactions, accounts } from '@lin-fan/db';
import { firebaseAuth, AuthVariables } from '../middleware/auth';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

app.use('*', firebaseAuth);

// GET /api/dashboard
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const userId = c.get('user').id;

    try {
        // 1. Total Assets (Sum of all accounts balance)
        const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId)).all();
        const totalAssets = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        // 2. Total Liabilities (Sum of all cards liability)
        const userCards = await db.select()
            .from(creditCards)
            .where(and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)))
            .all();

        // Calculate liability for each card (logic reused from cards.ts)
        // Ideally this logic should be refactored into a helper function
        const cardsWithLiability = await Promise.all(userCards.map(async (card) => {
            const txs = await db.select().from(transactions).where(eq(transactions.creditCardId, card.id)).all();
            let liability = 0;
            for (const tx of txs) {
                if (!tx.sourceAccountId) {
                    liability += tx.amount;
                } else {
                    liability -= tx.amount;
                }
            }
            return liability;
        }));
        const totalLiabilities = cardsWithLiability.reduce((sum, l) => sum + l, 0);

        // 3. Monthly Expenses
        // Sum of all transactions in current month where type is 'expense' (no sourceAccountId loop? Or category based?)
        // Let's use simple logic: All transactions in current month with (amount > 0 AND sourceAccountId NOT NULL AND destinationAccountId NULL) OR (creditCardId NOT NULL AND sourceAccountId NULL)
        // Basically: "Money out".
        //   - Cash/Account Expense: sourceAccountId is SET, destinationAccountId is NULL. (Amount is positive)
        //   - Credit Card Expense: creditCardId is SET, sourceAccountId is NULL. (Amount is positive)

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all transactions from start of month
        // We can't filter by date easily in SQLite via Drizzle unless we parse strings or use raw SQL.
        // Let's fetch reasonably recent transactions and filter in JS if needed, OR loop all (might be slow if thousands).
        // Since we are not doing pagination here yet, let's fetch all transactions for user and filter. 
        // Optimization: In real app, key by date or limit.
        // Let's fetch all (limit 1000?) or fetch by date range if possible.
        // Drizzle SQLite date is stored as integer (mode: timestamp) or string? Schema says: `date: integer('date', { mode: 'timestamp' }).notNull()`

        // Let's try to query with filter if possible.
        const recentTxs = await db.select()
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.date))
            .all();

        let monthlyExpenses = 0;
        const currentMonthTxs = recentTxs.filter(tx => tx.date >= startOfMonth && tx.date <= now);

        for (const tx of currentMonthTxs) {
            // Expenses check
            // 1. Account Expense: FROM Account -> External
            if (tx.sourceAccountId && !tx.destinationAccountId && !tx.creditCardId) {
                // Wait, Transfer to Credit Card (Payment) is: source=Acc, creditCard=Card. This is NOT expense.
                // Transfer to another Account is: source=Acc, destination=Acc. This is NOT expense.
                monthlyExpenses += tx.amount;
            }
            // 2. Credit Card Expense: FROM Card -> External
            else if (tx.creditCardId && !tx.sourceAccountId) {
                monthlyExpenses += tx.amount;
            }
        }

        // 4. Recent Transactions (Top 5)
        // We already fetched recentTxs ordered by date desc
        // We need to hydrate account/card names for display?
        // Or front-end does it? Front-end usually needs simple data.
        // Let's just return raw txs for now, or maybe join?
        // For simplicity, let's return raw and let FE resolve names if it has cache, or just show description/amount.
        const recentTransactions = recentTxs.slice(0, 5);

        return c.json({
            totalAssets,
            totalLiabilities,
            netWorth: totalAssets - totalLiabilities,
            monthlyExpenses,
            recentTransactions
        });

    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
