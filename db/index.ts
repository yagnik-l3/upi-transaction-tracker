import { DATABASE_NAME } from "@/constants";
import * as schema from "@/db/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

const expo = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expo, { schema });