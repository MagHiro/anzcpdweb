import { and, eq, sql } from "drizzle-orm";
import { rateLimitBuckets } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function consumeRateLimit(input: { key: string; limit: number; windowMs: number }): Promise<boolean> {
  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    // Serialize even the first request, before a bucket row exists. Row locks
    // alone cannot protect concurrent inserts into a previously empty bucket.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.key}, 0))`);
    const [existing] = await tx
      .select()
      .from(rateLimitBuckets)
      .where(eq(rateLimitBuckets.key, input.key))
      .for("update")
      .limit(1);

    if (!existing || now.getTime() - existing.windowStartedAt.getTime() >= input.windowMs) {
      await tx
        .insert(rateLimitBuckets)
        .values({ key: input.key, windowStartedAt: now, count: 1, updatedAt: now })
        .onConflictDoUpdate({
          target: rateLimitBuckets.key,
          set: { windowStartedAt: now, count: 1, updatedAt: now },
        });
      return true;
    }

    if (existing.count >= input.limit) return false;
    await tx
      .update(rateLimitBuckets)
      .set({ count: sql`${rateLimitBuckets.count} + 1`, updatedAt: now })
      .where(and(eq(rateLimitBuckets.key, input.key), eq(rateLimitBuckets.windowStartedAt, existing.windowStartedAt)));
    return true;
  });
}
