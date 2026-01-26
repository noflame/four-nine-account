import { integer, text, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Families Table
export const families = sqliteTable('families', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    inviteCode: text('invite_code').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const familiesRelations = relations(families, ({ many }) => ({
    members: many(users),
}));

// Users Table
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    firebaseUid: text('firebase_uid').unique(),
    role: text('role', { enum: ['admin', 'member', 'child'] }).notNull().default('member'),
    familyId: integer('family_id').references(() => families.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
    accounts: many(accounts),
    transactions: many(transactions),
    family: one(families, {
        fields: [users.familyId],
        references: [families.id],
    }),
}));

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

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
    sourceTransactions: many(transactions, { relationName: 'sourceAccount' }),
    destinationTransactions: many(transactions, { relationName: 'destinationAccount' }),
}));

// Credit Cards Table (Liabilities)
export const creditCards = sqliteTable('credit_cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    billingDay: integer('billing_day').notNull(), // 1-31
    paymentDay: integer('payment_day').notNull(), // 1-31
    creditLimit: integer('credit_limit').notNull().default(0), // x10000
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
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
    ownerLabel: text('owner_label').notNull().default('Self'),
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

export const categoriesRelations = relations(categories, ({ many }) => ({
    transactions: many(transactions),
}));

// Transactions Table
export const transactions = sqliteTable('transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    amount: integer('amount').notNull(), // x10000, always positive
    description: text('description').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    sourceAccountId: integer('source_account_id').references(() => accounts.id),
    destinationAccountId: integer('destination_account_id').references(() => accounts.id),
    creditCardId: integer('credit_card_id').references(() => creditCards.id),
    installmentId: integer('installment_id').references(() => creditCardInstallments.id),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
    sourceAccount: one(accounts, {
        fields: [transactions.sourceAccountId],
        references: [accounts.id],
        relationName: 'sourceAccount',
    }),
    destinationAccount: one(accounts, {
        fields: [transactions.destinationAccountId],
        references: [accounts.id],
        relationName: 'destinationAccount',
    }),
    creditCard: one(creditCards, {
        fields: [transactions.creditCardId],
        references: [creditCards.id],
    }),
    installment: one(creditCardInstallments, {
        fields: [transactions.installmentId],
        references: [creditCardInstallments.id],
    }),
}));
