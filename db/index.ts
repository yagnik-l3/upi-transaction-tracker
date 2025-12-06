import { DATABASE_NAME } from "@/constants";
import * as schema from "@/db/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

// Create a fresh database connection each time it's needed
// This prevents stale connection issues on Android
function createDb() {
    const expo = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
    return drizzle(expo, { schema });
}

export const db = createDb();