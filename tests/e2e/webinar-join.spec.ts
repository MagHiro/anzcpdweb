import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { bookings, categories, classes, user } from "@/db/schema";
import { getDb } from "@/lib/db";

test("join button works before event day and redirect checks account ownership", async ({ page }) => {
  test.skip(!process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD, "Local credentials required");
  const db = getDb();
  const [owner] = await db.select().from(user).where(eq(user.email, process.env.ADMIN_TEST_EMAIL!));
  const [category] = await db.insert(categories).values({ country: "AU", name: "Join test", slug: randomUUID() }).returning();
  const start = new Date(Date.now() + 3 * 86400000);
  const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Join webinar test", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: start, endAt: new Date(start.getTime() + 3600000), timezone: "Australia/Sydney", bookingOpensAt: new Date(), bookingClosesAt: new Date(), deliveryFormat: "ONLINE", meetingLink: "https://zoom.us/j/test-private", priceMinorUnits: 0, currency: "AUD", unlimitedCapacity: true, status: "PUBLISHED" }).returning();
  const [booking] = await db.insert(bookings).values({ classId: activity.id, userId: owner.id, fullName: "Join attendee", email: owner.email, country: "AU", status: "CONFIRMED", amountSnapshot: 0, currencySnapshot: "AUD", classTitleSnapshot: activity.title, timezoneSnapshot: activity.timezone, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID() }).returning();
  const path = `/account/bookings/${booking.id}`;
  try {
    const login = await page.request.post("/api/auth/login", { data: { email: process.env.ADMIN_TEST_EMAIL, password: process.env.ADMIN_TEST_PASSWORD }, headers: { origin: "http://127.0.0.1:3100" } });
    expect(login.ok()).toBe(true);
    await page.goto(path);
    await expect(page.getByRole("link", { name: "Join webinar" })).toBeVisible();
    const redirect = await page.request.get(`${path}/join`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(302);
    expect(redirect.headers().location).toBe(activity.meetingLink);
    await db.update(bookings).set({ userId: null }).where(eq(bookings.id, booking.id));
    expect((await page.request.get(`${path}/join`, { maxRedirects: 0 })).status()).toBe(403);
  } finally {
    await db.delete(bookings).where(eq(bookings.id, booking.id));
    await db.delete(classes).where(eq(classes.id, activity.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});
