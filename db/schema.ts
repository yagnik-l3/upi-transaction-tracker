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
}, (table) => [
    unique().on(table.accountNo, table.bankName),
    index("accounts_idx").on(table.accountNo, table.bankName)
]);
export type SelectAccount = typeof accountsTable.$inferSelect;
export type InsertAccount = typeof accountsTable.$inferInsert;
