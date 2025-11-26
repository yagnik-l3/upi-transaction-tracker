import { relations } from "drizzle-orm";
import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings_table", {
    id: int().primaryKey({ autoIncrement: true }),
    key: text().notNull().unique(),
    value: text().notNull(),
});
export type SelectSetting = typeof settingsTable.$inferSelect;
export type InsertSetting = typeof settingsTable.$inferInsert;

export const banksTable = sqliteTable("banks_table", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
})
export type SelectBank = typeof banksTable.$inferSelect;
export type InsertBank = typeof banksTable.$inferInsert;

export const transactionsTable = sqliteTable("transactions_table", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    accountId: int().notNull().references(() => accountsTable.id),
    amount: real().notNull(),
    receiver: text().notNull(),
    reference: text().notNull(),
    date: text().notNull(),
})
export type SelectTransaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;

export const accountsTable = sqliteTable("accounts_table", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    bankId: int().notNull().references(() => banksTable.id),
    upiLimit: real().notNull(),
});
export type SelectAccount = typeof accountsTable.$inferSelect;
export type InsertAccount = typeof accountsTable.$inferInsert;

export const bankRelations = relations(banksTable, ({ many }) => ({
    accounts: many(accountsTable),
}));

export const accountRelations = relations(accountsTable, ({ one, many }) => ({
    bank: one(banksTable, {
        fields: [accountsTable.bankId],
        references: [banksTable.id],
    }),
    transactions: many(transactionsTable),
}));

export const transactionRelations = relations(transactionsTable, ({ one }) => ({
    account: one(accountsTable, {
        fields: [transactionsTable.accountId],
        references: [accountsTable.id],
    }),
}));
