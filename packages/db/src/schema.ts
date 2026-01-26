import { integer, text, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Ledgers Table (New Boundary)
export const ledgers = sqliteTable('ledgers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    passwordHash: text('password_hash'), // Optional (some might not have password?) -> Plan says shared password.
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const ledgersRelations = relations(ledgers, ({ many }) => ({
    users: many(ledgerUsers),
    accounts: many(accounts),
    transactions: many(transactions),
    categories: many(categories),
}));

// Ledger Users (Many-to-Many with Role)
export const ledgerUsers = sqliteTable('ledger_users', {
    ledgerId: integer('ledger_id').references(() => ledgers.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('editor'),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.ledgerId, table.userId] }),
}));

export const ledgerUsersRelations = relations(ledgerUsers, ({ one }) => ({
    ledger: one(ledgers, {
        fields: [ledgerUsers.ledgerId],
        references: [ledgers.id],
    }),
    user: one(users, {
        fields: [ledgerUsers.userId],
        references: [users.id],
    }),
}));

// Users Table
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    firebaseUid: text('firebase_uid').unique(),
    // Family stuff to be removed later, keeping for migration
    role: text('role', { enum: ['admin', 'member', 'child'] }).notNull().default('member'),
    familyId: integer('family_id').references(() => families.id), // Keep reference for migration
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
    accounts: many(accounts),
    transactions: many(transactions),
    ledgers: many(ledgerUsers),
    family: one(families, {
        fields: [users.familyId],
        references: [families.id],
    }),
}));

// Accounts Table (Assets)
export const accounts = sqliteTable('accounts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id), // Keeping for "Created By"
    ledgerId: integer('ledger_id').references(() => ledgers.id), // Should be NotNull eventually
    name: text('name').notNull(),
    type: text('type', { enum: ['cash', 'bank', 'digital'] }).notNull(),
    currency: text('currency').notNull().default('TWD'),
    balance: integer('balance').notNull(), // x10000
    isVisibleToChild: integer('is_visible_to_child', { mode: 'boolean' }).notNull().default(false),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    // Private assets support
    isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
    ledger: one(ledgers, {
        fields: [accounts.ledgerId],
        references: [ledgers.id],
    }),
    sourceTransactions: many(transactions, { relationName: 'sourceAccount' }),
    destinationTransactions: many(transactions, { relationName: 'destinationAccount' }),
}));

// Credit Cards Table (Liabilities)
export const creditCards = sqliteTable('credit_cards', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id),
    ledgerId: integer('ledger_id').references(() => ledgers.id),
    name: text('name').notNull(),
    billingDay: integer('billing_day').notNull(), // 1-31
    paymentDay: integer('payment_day').notNull(), // 1-31
    creditLimit: integer('credit_limit').notNull().default(0), // x10000
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const creditCardsRelations = relations(creditCards, ({ one }) => ({
    ledger: one(ledgers, {
        fields: [creditCards.ledgerId],
        references: [ledgers.id],
    }),
}));

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
    userId: integer('user_id').references(() => users.id),
    ledgerId: integer('ledger_id').references(() => ledgers.id),
    ticker: text('ticker').notNull(),
    shares: integer('shares').notNull(), // x10000 (supports fractional)
    avgCost: integer('avg_cost').notNull(), // x10000
    ownerLabel: text('owner_label').notNull().default('Self'),
});

export const stocksRelations = relations(stocks, ({ one }) => ({
    user: one(users, {
        fields: [stocks.userId],
        references: [users.id],
    }),
    ledger: one(ledgers, {
        fields: [stocks.ledgerId],
        references: [ledgers.id],
    }),
}));

// Stock Prices (Historical Data) - Global Data? No need ledgerId unless private prices?
// Maintaining as global for now.
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
    ledgerId: integer('ledger_id').references(() => ledgers.id), // Nullable for global defaults? Or copy per ledger?
    name: text('name').notNull(),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    icon: text('icon'), // Optional icon identifier
});

export const categoriesRelations = relations(categories, ({ many, one }) => ({
    transactions: many(transactions),
    ledger: one(ledgers, {
        fields: [categories.ledgerId],
        references: [ledgers.id],
    }),
}));

// Transactions Table
export const transactions = sqliteTable('transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ledgerId: integer('ledger_id').references(() => ledgers.id),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    amount: integer('amount').notNull(), // x10000, always positive
    description: text('description').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    sourceAccountId: integer('source_account_id').references(() => accounts.id),
    destinationAccountId: integer('destination_account_id').references(() => accounts.id),
    creditCardId: integer('credit_card_id').references(() => creditCards.id),
    installmentId: integer('installment_id').references(() => creditCardInstallments.id),
    userId: integer('user_id').references(() => users.id).notNull(), // Keep who created it
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    ledger: one(ledgers, {
        fields: [transactions.ledgerId],
        references: [ledgers.id],
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

// Families Table (Deprecated - kept for migration)
export const families = sqliteTable('families', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    inviteCode: text('invite_code').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const familiesRelations = relations(families, ({ many }) => ({
    members: many(users),
}));
