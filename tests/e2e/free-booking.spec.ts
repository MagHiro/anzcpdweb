import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { accountClaimTokens, bookings, categories, classes, emailOutbox, paymentReceipts, payments } from "@/db/schema";
import { getDb } from "@/lib/db";

test("zero-cost booking completes without a Stripe redirect", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "Needs an isolated test database");
  const db = getDb();
  const [category] = await db.insert(categories).values({ country: "AU", name: "Free booking test", slug: randomUUID() }).returning();
  const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Free booking browser test", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), timezone: "Australia/Sydney", bookingOpensAt: new Date(Date.now() - 1000), bookingClosesAt: new Date(Date.now() + 3600000), deliveryFormat: "ONLINE", priceMinorUnits: 0, currency: "AUD", unlimitedCapacity: true, professionalIdentifierRequired: false, status: "PUBLISHED", onlineAttendanceInfo: "Join using your booking details." }).returning();
  const email = `free-browser-${randomUUID()}@example.com`;
  const stripeRequests: string[] = [];
  page.on("request", request => { if (/stripe\.com/.test(request.url())) stripeRequests.push(request.url()); });
  try {
    await page.goto(`/classes/${activity.slug}/book`);
    await expect(page.getByRole("heading", { name: "Complete your booking" })).toBeVisible();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.getByRole("textbox", { name: "Full name", exact: true }).fill("Free Attendee");
    await page.getByRole("textbox", { name: "Email address", exact: true }).fill(email);
    await page.getByRole("textbox", { name: "Confirm email address", exact: true }).fill(email);
    await page.getByRole("checkbox", { name: /I agree to/ }).check();
    await page.getByRole("checkbox", { name: /I acknowledge/ }).check();
    await page.getByRole("button", { name: "Review booking", exact: true }).click();
    await page.getByRole("button", { name: "Confirm booking", exact: true }).click();
    await expect(page).toHaveURL(/\/booking\/confirmation\?token=/);
    await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your place is confirmed" })).toBeVisible();
    await expect(page.getByText("Free · No payment required", { exact: true })).toBeVisible();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    expect(stripeRequests).toEqual([]);
    const [booking] = await db.select().from(bookings).where(eq(bookings.email, email));
    expect(booking.status).toBe("CONFIRMED");
    expect(booking.stripeCheckoutSessionId).toBeNull();
    await page.getByRole("link", { name: "View receipt", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Booking receipt" })).toBeVisible();
    await expect(page.getByText("No payment required", { exact: true })).toBeVisible();
  } finally {
    const rows = await db.select().from(bookings).where(eq(bookings.email, email));
    await db.delete(accountClaimTokens).where(eq(accountClaimTokens.email, email));
    await db.delete(emailOutbox).where(eq(emailOutbox.recipientEmail, email));
    for (const booking of rows) {
      await db.delete(paymentReceipts).where(eq(paymentReceipts.bookingId, booking.id));
      await db.delete(payments).where(eq(payments.bookingId, booking.id));
      await db.delete(bookings).where(eq(bookings.id, booking.id));
    }
    await db.delete(classes).where(eq(classes.id, activity.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});
