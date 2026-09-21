import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, getDb } from "@/lib/db";

async function main() {
  await migrate(getDb(), { migrationsFolder: "./db/migrations" });
  console.log("Database migrations applied.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDb());
