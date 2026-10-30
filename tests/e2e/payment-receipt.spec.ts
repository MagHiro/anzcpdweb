import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { accountClaimTokens, bookings, categories, classes, countries, paymentReceipts, payments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createAccountToken } from "@/server/auth/tokens";
import { issuePaymentReceipt } from "@/server/payments/receipts";

test("private receipt is readable on mobile and prints without site chrome", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "Needs an isolated test database");
  const db = getDb();
  await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
  const [category] = await db.insert(categories).values({ country: "AU", name: "Receipt browser test", slug: randomUUID() }).returning();
  const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Practical migration law — professional development", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), timezone: "Australia/Sydney", bookingOpensAt: new Date(), bookingClosesAt: new Date(Date.now() + 3600000), deliveryFormat: "ONLINE", priceMinorUnits: 14900, currency: "NZD", unlimitedCapacity: true }).returning();
  const [booking] = await db.insert(bookings).values({ classId: activity.id, fullName: "Alex Morgan", email: "receipt-browser@example.com", country: "AU", status: "CONFIRMED", amountSnapshot: 14900, currencySnapshot: "NZD", classTitleSnapshot: activity.title, timezoneSnapshot: activity.timezone, paidAt: new Date(), termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID() }).returning();
  await db.insert(payments).values({ bookingId: booking.id, status: "PARTIALLY_REFUNDED", amountTotal: 14900, amountCaptured: 14900, amountRefunded: 2500, currency: "NZD" });
  await issuePaymentReceipt(booking.id);
  const token = await createAccountToken({ email: booking.email, purpose: "GUEST_BOOKING_ACCESS", bookingId: booking.id });
  try {
    await page.goto(`/booking/receipt/${booking.id}`);
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toHaveCount(0);
    await page.goto(`/booking/receipt/${randomUUID()}?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toHaveCount(0);
    await page.goto(`/booking/receipt/${booking.id}?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toBeVisible();
    await expect(page.getByText("Alex Morgan", { exact: true })).toBeVisible();
    await expect(page.getByText("Refunded to date", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Print / save PDF" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("button", { name: "Print / save PDF" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toBeVisible();
    await expect(page.locator(".academy-site > header")).toBeHidden();
  } finally {
    await db.delete(accountClaimTokens).where(eq(accountClaimTokens.bookingId, booking.id));
    await db.delete(paymentReceipts).where(eq(paymentReceipts.bookingId, booking.id));
    await db.delete(payments).where(eq(payments.bookingId, booking.id));
    await db.delete(bookings).where(eq(bookings.id, booking.id));
    await db.delete(classes).where(eq(classes.id, activity.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});
