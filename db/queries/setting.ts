import { eq } from "drizzle-orm";
import { db } from "..";
import { settingsTable } from "../schema";

export async function get(key: string) {
    return db.query.settingsTable.findFirst({
        where: eq(settingsTable.key, key),
    });
}

export async function set(key: string, value: string) {
    const existing = await get(key);

    if (existing) {
        const [updated] = await db
            .update(settingsTable)
            .set({ value })
            .where(eq(settingsTable.key, key))
            .returning();
        return updated;
    } else {
        const [created] = await db
            .insert(settingsTable)
            .values({ key, value })
            .returning();
        return created;
    }
}

export async function getLastSmsTimestamp(): Promise<number> {
    const setting = await get('lastSmsTimestamp');
    return setting ? parseInt(setting.value) : 0;
}

export async function setLastSmsTimestamp(timestamp: number) {
    return set('lastSmsTimestamp', timestamp.toString());
}

export async function getLastRefreshTime(): Promise<number | null> {
    const setting = await get('lastRefreshTime');
    return setting ? parseInt(setting.value) : null;
}

export async function setLastRefreshTime(timestamp: number) {
    return set('lastRefreshTime', timestamp.toString());
}
