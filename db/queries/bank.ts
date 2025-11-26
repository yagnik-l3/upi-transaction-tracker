import type { SQL } from "drizzle-orm";

import { and, eq } from "drizzle-orm";

import { db } from "..";
import { banksTable, type InsertBank } from "../schema";

export async function create(data: InsertBank) {
    const [bank] = await db.insert(banksTable).values(data).returning();
    return bank ?? null;
}

export async function createMany(data: InsertBank[]) {
    const banks = await db.insert(banksTable).values(data).returning();
    return banks;
}

export async function update(data: Partial<InsertBank> & { id: number }) {
    const [bank] = await db.update(banksTable).set(data).where(eq(banksTable.id, data.id)).returning();
    return bank ?? null;
}

export async function remove(data: { id: number }) {
    const [bank] = await db.delete(banksTable).where(eq(banksTable.id, data.id)).returning();
    return bank ?? null;
}

export async function findOne_And(data: { id?: number; name?: string }) {
    const conditions: SQL[] = [];
    if (data.id) {
        conditions.push(eq(banksTable.id, data.id));
    }
    if (data.name) {
        conditions.push(eq(banksTable.name, data.name));
    }
    return db.query.banksTable.findFirst({
        where: and(...conditions),
    });
}

export async function findAll(data: { id?: number; name?: string }) {
    const conditions: SQL[] = [];
    if (data.id) {
        conditions.push(eq(banksTable.id, data.id));
    }
    if (data.name) {
        conditions.push(eq(banksTable.name, data.name));
    }
    return db.query.banksTable.findMany({
        where: and(...conditions),
    });
}

