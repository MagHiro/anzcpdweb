import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { closeDb, getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { user } from "@/db/schema";

async function main() {
  const env = getServerEnv();
  if (!env.INITIAL_ADMIN_EMAIL || !env.INITIAL_ADMIN_PASSWORD || !env.INITIAL_ADMIN_NAME) throw new Error("Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD and INITIAL_ADMIN_NAME for the one-time bootstrap.");
  const email = env.INITIAL_ADMIN_EMAIL.toLowerCase();
  const db = getDb();
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  let userId = existing?.id;
  if (!userId) {
    const result = await auth.api.signUpEmail({ body: { name: env.INITIAL_ADMIN_NAME, email, password: env.INITIAL_ADMIN_PASSWORD }, headers: new Headers({ origin: env.APP_URL }) });
    userId = result.user.id;
  }
  await db.update(user).set({ role: "ADMIN", emailVerified: true, updatedAt: new Date() }).where(eq(user.id, userId));
  console.log(`Admin bootstrap complete for ${email}. Remove the bootstrap variables after use.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDb());
