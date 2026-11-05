import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rateLimitBuckets } from "@/db/schema";
import { consumeRateLimit } from "@/server/security/rate-limit";

describe.skipIf(!process.env.DATABASE_URL)("rate limiter concurrency", () => {
  it("permits only the configured number of concurrent first requests", async () => {
    const key = `security-test:${randomUUID()}`;
    try {
      const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimit({ key, limit: 5, windowMs: 60000 })));
      expect(results.filter(Boolean)).toHaveLength(5);
    } finally { await getDb().delete(rateLimitBuckets).where(eq(rateLimitBuckets.key, key)); }
  });
});
