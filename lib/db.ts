import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
  database?: Database;
};

export function getDb(): Database {
  if (globalForDb.database) return globalForDb.database;

  const client = globalForDb.postgresClient ?? postgres(getServerEnv().DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  globalForDb.postgresClient = client;
  globalForDb.database = drizzle(client, { schema });
  return globalForDb.database;
}

export async function closeDb(): Promise<void> {
  const client = globalForDb.postgresClient;
  if (!client) return;
  await client.end({ timeout: 5 });
  globalForDb.postgresClient = undefined;
  globalForDb.database = undefined;
}

export type { Database };
