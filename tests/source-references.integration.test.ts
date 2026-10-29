import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { sourceReferences } from "@/db/schema";
import { getDb } from "@/lib/db";
import { deleteSourceReference } from "@/server/catalogue/service";

describe.skipIf(!process.env.DATABASE_URL)("source reference deletion", () => {
  it("deletes an unused reference and rejects missing references", async () => {
    const db = getDb();
    const [source] = await db.insert(sourceReferences).values({ authority: "Test", title: randomUUID(), url: "https://example.com", jurisdiction: "AU", checkedAt: new Date() }).returning();
    try {
      expect((await deleteSourceReference(source.id)).id).toBe(source.id);
      expect(await db.select().from(sourceReferences).where(eq(sourceReferences.id, source.id))).toHaveLength(0);
      await expect(deleteSourceReference(source.id)).rejects.toThrow("not found");
    } finally {
      await db.delete(sourceReferences).where(eq(sourceReferences.id, source.id));
    }
  });
});
