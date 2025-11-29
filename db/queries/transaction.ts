import type { SQL } from "drizzle-orm";

import { and, eq, gte, lte } from "drizzle-orm";

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

export async function findAll(data: { accountNo?: string, bankName?: string }) {
    const conditions: SQL[] = []
    if (data.accountNo) {
        conditions.push(eq(transactionsTable.accountNo, data.accountNo))
    }
    if (data.bankName) {
        conditions.push(eq(transactionsTable.bankName, data.bankName))
    }
    return db.query.transactionsTable.findMany({
        where: and(...conditions),
    });
}

export async function getDailyTotal(accountNo: string, bankName: string, date: string): Promise<number> {
    const transactions = await db.query.transactionsTable.findMany({
        where: and(
            eq(transactionsTable.accountNo, accountNo),
            eq(transactionsTable.bankName, bankName),
            gte(transactionsTable.timestamp, Date.parse(date)),
            lte(transactionsTable.timestamp, Date.parse(date))
        ),
    });

    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}
