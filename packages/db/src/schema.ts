import { integer, text, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';

// Users Table
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: text('role', { enum: ['admin', 'member', 'child'] }).notNull().default('member'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Accounts Table (Assets)
export const accounts = sqliteTable('accounts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    type: text('type', { enum: ['cash', 'bank', 'digital'] }).notNull(),
    currency: text('currency').notNull().default('TWD'),
    balance: integer('balance').notNull(), // x10000
    isVisibleToChild: integer('is_visible_to_child', { mode: 'boolean' }).notNull().default(false),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Credit Cards Table (Liabilities)
export const creditCards = sqliteTable('credit_cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    billingDay: integer('billing_day').notNull(), // 1-31
    paymentDay: integer('payment_day').notNull(), // 1-31
});

// Credit Card Installments
export const creditCardInstallments = sqliteTable('credit_card_installments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cardId: integer('card_id').references(() => creditCards.id).notNull(),
    description: text('description').notNull(),
    totalAmount: integer('total_amount').notNull(), // x10000
    totalMonths: integer('total_months').notNull(),
    remainingMonths: integer('remaining_months').notNull(),
    startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
});

// Stocks (Portfolio Holdings)
export const stocks = sqliteTable('stocks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    ticker: text('ticker').notNull(),
    shares: integer('shares').notNull(), // x10000 (supports fractional)
    avgCost: integer('avg_cost').notNull(), // x10000
});

// Stock Prices (Historical Data)
// Composite PK: ticker + date
export const stockPrices = sqliteTable('stock_prices', {
    ticker: text('ticker').notNull(),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    close: integer('close').notNull(), // x10000
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.ticker, table.date] }),
    };
});

// Categories Table
export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    icon: text('icon'), // Optional icon identifier
});

// Transactions Table
export const transactions = sqliteTable('transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    amount: integer('amount').notNull(), // x10000, always positive
    description: text('description').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    sourceAccountId: integer('source_account_id').references(() => accounts.id),
    destinationAccountId: integer('destination_account_id').references(() => accounts.id),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});
