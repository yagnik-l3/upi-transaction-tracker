import type { SQL } from "drizzle-orm";

import { and, eq } from "drizzle-orm";

import { db } from "..";
import { accountsTable, type InsertAccount } from "../schema";

export async function create(data: InsertAccount) {
    const [account] = await db.insert(accountsTable).values(data).returning();
    return account ?? null;
}

export async function createMany(data: InsertAccount[]) {
    const accounts = await db.insert(accountsTable).values(data).returning();
    return accounts;
}

export async function update(data: Partial<InsertAccount> & { id: number }) {
    const [account] = await db.update(accountsTable).set(data).where(eq(accountsTable.id, data.id)).returning();
    return account ?? null;
}

export async function remove(data: { id: number }) {
    const [account] = await db.delete(accountsTable).where(eq(accountsTable.id, data.id)).returning();
    return account ?? null;
}

export async function findOne_And(data: { id?: number; name?: string }) {
    const conditions: SQL[] = [];
    if (data.id) {
        conditions.push(eq(accountsTable.id, data.id));
    }
    return db.query.accountsTable.findFirst({
        where: and(...conditions),
    });
}

export async function findAll(data: { bankId?: number }) {
    const conditions: SQL[] = []
    if (data.bankId) {
        conditions.push(eq(accountsTable.bankId, data.bankId))
    }
    return db.query.accountsTable.findMany({
        where: and(...conditions),
        with: {
            bank: true
        }
    });
}

