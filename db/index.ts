import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;

// 建立 PostgreSQL 連線
const client = postgres(connectionString);

// 建立 Drizzle 實例
export const db = drizzle(client, { schema });
