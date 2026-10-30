import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { categories, classes, countries } from "@/db/schema";
import { getDb } from "@/lib/db";

test.use({ timezoneId: "America/New_York" });

test("online timezone selection synchronizes times; venue classes stay local", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "Needs an isolated database");
  const db = getDb();
  await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
  const [category] = await db.insert(categories).values({ country: "AU", name: "Timezone test", slug: randomUUID() }).returning();
  const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Timezone test activity", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: new Date("2027-06-01T00:00:00Z"), endAt: new Date("2027-06-01T02:00:00Z"), timezone: "Australia/Sydney", bookingOpensAt: new Date("2026-01-01"), bookingClosesAt: new Date("2027-05-30"), deliveryFormat: "ONLINE", priceMinorUnits: 10000, currency: "AUD", unlimitedCapacity: true, status: "PUBLISHED" }).returning();
  try {
    await page.goto(`/classes/${activity.slug}`);
    const selector = page.getByLabel("Display timezone");
    await expect(selector).toHaveValue("America/New_York");
    await selector.selectOption("UTC");
    await expect(page.locator("time").first()).toContainText("12:00 am");
    await expect(page.getByText("Timezone: UTC", { exact: true }).first()).toBeVisible();
    await db.update(classes).set({ deliveryFormat: "IN_PERSON", venueName: "Sydney", venueAddress: "Sydney" }).where(eq(classes.id, activity.id));
    await page.reload();
    await expect(selector).toHaveCount(0);
    await expect(page.locator("time").first()).toContainText("10:00 am");
    await expect(page.getByText("Venue timezone: Australia/Sydney", { exact: true }).first()).toBeVisible();
  } finally {
    await db.delete(classes).where(eq(classes.id, activity.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});
