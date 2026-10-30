import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { categories, classes, countries, classSourceReferences, sourceReferences } from "@/db/schema";
import { getDb } from "@/lib/db";
import { deleteSourceReference, replaceClassSources } from "@/server/catalogue/service";
import { getClassSourceOptions } from "@/server/catalogue/queries";

describe.skipIf(!process.env.DATABASE_URL)("source reference deletion", () => {
  it("shows and preserves existing cross-country attachments without allowing new mismatches", async () => {
    const db = getDb();
    await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
    await db.insert(countries).values({ code: "NZ", name: "New Zealand", currency: "NZD", identifierType: "IAA", identifierLabel: "IAA", cpdUnitType: "HOURS", defaultTimezone: "Pacific/Auckland", description: "Test" }).onConflictDoNothing();
    const [category] = await db.insert(categories).values({ country: "AU", name: "Source test", slug: randomUUID() }).returning();
    const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Source test", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: new Date("2027-06-01"), endAt: new Date("2027-06-02"), timezone: "Australia/Sydney", bookingOpensAt: new Date("2026-01-01"), bookingClosesAt: new Date("2027-05-30"), deliveryFormat: "ONLINE", priceMinorUnits: 100, currency: "AUD", unlimitedCapacity: true }).returning();
    const [source] = await db.insert(sourceReferences).values({ authority: "Test", title: randomUUID(), url: "https://example.com", jurisdiction: "NZ", checkedAt: new Date() }).returning();
    try {
      await db.insert(classSourceReferences).values({ classId: activity.id, sourceReferenceId: source.id });
      const options = await getClassSourceOptions(activity.id, "AU");
      expect(options.selectedIds).toContain(source.id);
      expect(options.sources.some(item => item.id === source.id)).toBe(true);
      await replaceClassSources(activity.id, [source.id]);
      expect((await getClassSourceOptions(activity.id, "AU")).selectedIds).toContain(source.id);
      await replaceClassSources(activity.id, []);
      await expect(replaceClassSources(activity.id, [source.id])).rejects.toThrow("must match the class country");
      expect((await getClassSourceOptions(activity.id, "AU")).selectedIds).toEqual([]);
    } finally {
      await db.delete(classSourceReferences).where(eq(classSourceReferences.classId, activity.id));
      await db.delete(classes).where(eq(classes.id, activity.id));
      await db.delete(categories).where(eq(categories.id, category.id));
      await db.delete(sourceReferences).where(eq(sourceReferences.id, source.id));
    }
  });
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
