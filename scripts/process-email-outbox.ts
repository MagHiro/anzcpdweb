import "dotenv/config";
import { processEmailOutbox } from "@/server/email/service";
import { closeDb } from "@/lib/db";

async function main() {
  console.log(await processEmailOutbox(50));
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDb());
