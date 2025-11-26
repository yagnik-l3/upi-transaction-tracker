import type { SQL } from "drizzle-orm";

import { and, eq } from "drizzle-orm";

import { db } from "..";
import { transactionsTable, type InsertTransaction } from "../schema";

export async function create(data: InsertTransaction) {
    const [account] = await db.insert(transactionsTable).values(data).returning();
    return account ?? null;
}

export async function createMany(data: InsertTransaction[]) {
    const accounts = await db.insert(transactionsTable).values(data).returning();
    return accounts;
}

export async function update(data: Partial<InsertTransaction> & { id: number }) {
    const [account] = await db.update(transactionsTable).set(data).where(eq(transactionsTable.id, data.id)).returning();
    return account ?? null;
}

export async function remove(data: { id: number }) {
    const [account] = await db.delete(transactionsTable).where(eq(transactionsTable.id, data.id)).returning();
    return account ?? null;
}

export async function findOne_And(data: { id?: number; accountId?: number }) {
    const conditions: SQL[] = [];
    if (data.id) {
        conditions.push(eq(transactionsTable.id, data.id));
    }
    return db.query.transactionsTable.findFirst({
        where: and(...conditions),
    });
}

export async function findAll(data: { accountId?: number }) {
    const conditions: SQL[] = []
    if (data.accountId) {
        conditions.push(eq(transactionsTable.accountId, data.accountId))
    }
    return db.query.transactionsTable.findMany({
        where: and(...conditions),
        with: {
            account: true
        }
    });
}

export async function getDailyTotal(accountId: number, date: string): Promise<number> {
    // date format expected: YYYY-MM-DD
    const transactions = await db.query.transactionsTable.findMany({
        where: and(
            eq(transactionsTable.accountId, accountId)
        ),
    });

    const dailyTransactions = transactions.filter(tx => tx.date.startsWith(date));
    return dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0);
}
