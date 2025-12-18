import type { SQL } from "drizzle-orm";

import { and, eq, gte, like, lte } from "drizzle-orm";

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

export async function findAll(data: {
    accountNo?: string,
    bankName?: string,
    limit?: number,
    offset?: number,
    startDate?: number,
    endDate?: number
}) {
    const conditions: SQL[] = []

    if (data.accountNo) {
        conditions.push(like(transactionsTable.accountNo, `%${data.accountNo}%`))
    }
    if (data.bankName) {
        conditions.push(eq(transactionsTable.bankName, data.bankName))
    }

    if (data.startDate) {
        conditions.push(gte(transactionsTable.timestamp, data.startDate));
    }

    if (data.endDate) {
        conditions.push(lte(transactionsTable.timestamp, data.endDate));
    }

    return db.query.transactionsTable.findMany({
        where: and(...conditions),
        limit: data.limit,
        offset: data.offset,
        orderBy: (table, { desc }) => [desc(table.timestamp)],
    });
}

export async function getDailyTotal(accountNo: string, bankName: string, date: string): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await db.query.transactionsTable.findMany({
        where: and(
            like(transactionsTable.accountNo, `%${accountNo}%`),
            eq(transactionsTable.bankName, bankName),
            gte(transactionsTable.timestamp, startOfDay.getTime()),
            lte(transactionsTable.timestamp, endOfDay.getTime())
        ),
    });

    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

export async function getYesterdayTotal(accountNo: string, bankName: string): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await db.query.transactionsTable.findMany({
        where: and(
            like(transactionsTable.accountNo, `%${accountNo}%`),
            eq(transactionsTable.bankName, bankName),
            gte(transactionsTable.timestamp, startOfDay.getTime()),
            lte(transactionsTable.timestamp, endOfDay.getTime())
        ),
    });

    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

export async function getTodayTransactions(accountNo: string, bankName: string): Promise<typeof transactionsTable.$inferSelect[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return db.query.transactionsTable.findMany({
        where: and(
            like(transactionsTable.accountNo, `%${accountNo}%`),
            eq(transactionsTable.bankName, bankName),
            gte(transactionsTable.timestamp, startOfDay.getTime()),
            lte(transactionsTable.timestamp, endOfDay.getTime())
        ),
        orderBy: (table, { desc }) => [desc(table.timestamp)],
    });
}

export async function getCumulativeTotal(accountNo: string, bankName: string): Promise<number> {
    const transactions = await db.query.transactionsTable.findMany({
        where: and(
            like(transactionsTable.accountNo, `%${accountNo}%`),
            eq(transactionsTable.bankName, bankName)
        ),
    });

    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}
