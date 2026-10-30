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
    await page.goto(`/classes?q=${encodeURIComponent(activity.title)}`);
    const card = page.locator("article.activity-card").filter({ hasText: activity.title });
    await expect(card.getByRole("heading", { name: activity.title })).toBeVisible();
    await expect(card.getByText("Timezone: America/New_York", { exact: true })).toBeVisible();
    await expect(card.getByText("No seat limit", { exact: true })).toHaveCount(0);
    await page.getByLabel("Display timezone").selectOption("Pacific/Auckland");
    await expect(card.locator("time").first()).toContainText("12:00 pm");
    await expect(card.getByText("Timezone: Pacific/Auckland", { exact: true })).toBeVisible();
    await page.goto(`/classes/${activity.slug}`);
    const selector = page.getByLabel("Display timezone");
    await expect(selector).toHaveValue("Pacific/Auckland");
    await selector.selectOption("UTC");
    await expect(page.locator("time").first()).toContainText("12:00 am");
    await expect(page.getByText("Timezone: UTC", { exact: true }).first()).toBeVisible();
    await page.reload();
    await expect(selector).toHaveValue("UTC");
    await expect(page.locator("time").first()).toContainText("12:00 am");
    await page.goto(`/classes/${activity.slug}/book`);
    await expect(page.getByLabel("Display timezone")).toHaveValue("UTC");
    await expect(page.locator("time").first()).toContainText("12:00 am");
    await page.goto(`/classes/${activity.slug}`);
    await db.update(classes).set({ deliveryFormat: "IN_PERSON", venueName: "Sydney", venueAddress: "Sydney" }).where(eq(classes.id, activity.id));
    await page.reload();
    await expect(selector).toHaveCount(0);
    await expect(page.locator("time").first()).toContainText("10:00 am");
    await expect(page.getByText("Venue timezone: Australia/Sydney", { exact: true }).first()).toBeVisible();
    await page.goto(`/classes?q=${encodeURIComponent(activity.title)}`);
    await expect(card.getByText("Venue timezone: Australia/Sydney", { exact: true })).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await db.delete(classes).where(eq(classes.id, activity.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});

test("invalid saved timezones fall back to the browser timezone", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("anzcpd-display-timezone", "invalid/timezone"));
  await page.goto("/classes");
  const selector = page.getByLabel("Display timezone");
  test.skip(await selector.count() === 0, "No online classes available");
  await expect(selector).toHaveValue("");
  await expect(selector.locator("option:checked")).toContainText("America/New York");
});
