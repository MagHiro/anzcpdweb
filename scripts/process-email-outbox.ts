import "dotenv/config";
import { processEmailOutbox } from "@/server/email/service";
import { closeDb } from "@/lib/db";
import { enqueueEventReminders } from "@/server/email/reminders";

async function main() {
  console.log({ remindersQueued: await enqueueEventReminders() });
  console.log(await processEmailOutbox(50));
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDb());
