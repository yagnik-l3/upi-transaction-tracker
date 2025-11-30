import { index, int, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
    id: int().primaryKey({ autoIncrement: true }),
    key: text().notNull().unique(),
    value: text().notNull(),
});
export type SelectSetting = typeof settingsTable.$inferSelect;
export type InsertSetting = typeof settingsTable.$inferInsert;

export const banksTable = sqliteTable("banks", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
})
export type SelectBank = typeof banksTable.$inferSelect;
export type InsertBank = typeof banksTable.$inferInsert;

export const transactionsTable = sqliteTable("transactions", {
    id: int().primaryKey({ autoIncrement: true }),
    amount: real().notNull(),
    receiver: text().notNull(),
    reference: text().notNull(),
    date: text().notNull(),
    bankName: text().notNull(),
    timestamp: int().notNull(),
    accountNo: text().notNull(),
    rawMessage: text().notNull(),
}, (table) => [
    index("transactions_idx").on(table.bankName, table.accountNo),
])
export type SelectTransaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;

export const accountsTable = sqliteTable("accounts", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    bankName: text().notNull(),
    accountNo: text().notNull(),
    upiLimit: real().notNull(),
    cardColor: text().default('#6366f1'),
    cardIcon: text().default('account-balance'),
}, (table) => [
    unique().on(table.accountNo, table.bankName),
    index("accounts_idx").on(table.accountNo, table.bankName)
]);
export type SelectAccount = typeof accountsTable.$inferSelect;
export type InsertAccount = typeof accountsTable.$inferInsert;

// Available card colors and icons for user selection
export const CARD_COLORS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
];

export const CARD_ICONS = [
    { name: 'Bank', value: 'account-balance' },
    { name: 'Wallet', value: 'account-balance-wallet' },
    { name: 'Card', value: 'credit-card' },
    { name: 'Savings', value: 'savings' },
    { name: 'Money', value: 'attach-money' },
    { name: 'Business', value: 'business-center' },
    { name: 'Home', value: 'home' },
    { name: 'Star', value: 'star' },
];
