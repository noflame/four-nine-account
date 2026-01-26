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
    const ledger = c.get('ledger');

    if (!ledger) return c.json({ error: 'Ledger context required' }, 403);

    const userId = c.get('user').id;

    try {
        // 1. Total Assets (Sum of all accounts balance in this ledger)
        const userAccounts = await db.select().from(accounts)
            .where(and(eq(accounts.ledgerId, ledger.id), eq(accounts.userId, userId))) // userId check technically redundant if ledger isolation is strict, but safe
            .all();
        const totalAssets = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        // 2. Total Liabilities (Sum of all cards liability in this ledger)
        const userCards = await db.select()
            .from(creditCards)
            .where(and(eq(creditCards.ledgerId, ledger.id), eq(creditCards.userId, userId), isNull(creditCards.deletedAt)))
            .all();

        // Calculate liability for each card
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

        // 3. Monthly Expenses (Ledger Scoped)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const recentTxs = await db.select()
            .from(transactions)
            .where(and(eq(transactions.ledgerId, ledger.id), eq(transactions.userId, userId)))
            .orderBy(desc(transactions.date))
            .all();

        let monthlyExpenses = 0;
        const currentMonthTxs = recentTxs.filter(tx => tx.date >= startOfMonth && tx.date <= now);

        for (const tx of currentMonthTxs) {
            // Expenses check
            // 1. Account Expense: FROM Account -> External
            if (tx.sourceAccountId && !tx.destinationAccountId && !tx.creditCardId) {
                monthlyExpenses += tx.amount;
            }
            // 2. Credit Card Expense: FROM Card -> External
            else if (tx.creditCardId && !tx.sourceAccountId) {
                monthlyExpenses += tx.amount;
            }
        }

        // 4. Recent Transactions (Top 5)
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
