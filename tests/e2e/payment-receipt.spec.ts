import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { accountClaimTokens, bookings, categories, classes, classPromoCodes, countries, paymentReceipts, payments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { createAccountToken } from "@/server/auth/tokens";
import { issuePaymentReceipt } from "@/server/payments/receipts";

test("promo pricing reaches booking review and the private printable receipt", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "Needs an isolated test database");
  const db = getDb();
  await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
  const [category] = await db.insert(categories).values({ country: "AU", name: "Receipt browser test", slug: randomUUID() }).returning();
  const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Practical migration law — professional development", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), timezone: "Australia/Sydney", bookingOpensAt: new Date(), bookingClosesAt: new Date(Date.now() + 3600000), deliveryFormat: "ONLINE", priceMinorUnits: 19900, currency: "NZD", unlimitedCapacity: true, promoMode: "LINK_ONLY", status: "PUBLISHED" }).returning();
  const [promo] = await db.insert(classPromoCodes).values({
    classId: activity.id, code: "WORKSHOP50", discountType: "FIXED", discountValue: 5000,
    validFrom: activity.bookingOpensAt, validUntil: activity.bookingClosesAt,
  }).returning();
  const [booking] = await db.insert(bookings).values({ classId: activity.id, fullName: "Alex Morgan", email: "receipt-browser@example.com", country: "AU", status: "CONFIRMED", amountSnapshot: 14900, currencySnapshot: "NZD", promoCodeId: promo.id, promoCodeSnapshot: promo.code, discountMinorUnits: 5000, classTitleSnapshot: activity.title, timezoneSnapshot: activity.timezone, paidAt: new Date(), termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID() }).returning();
  await db.insert(payments).values({ bookingId: booking.id, status: "PARTIALLY_REFUNDED", amountTotal: 14900, amountCaptured: 14900, amountRefunded: 2500, currency: "NZD" });
  await issuePaymentReceipt(booking.id);
  const token = await createAccountToken({ email: booking.email, purpose: "GUEST_BOOKING_ACCESS", bookingId: booking.id });
  try {
    await page.goto(`/classes/${activity.slug}/book?promo=${promo.linkToken}`);
    const summary = page.getByRole("complementary", { name: activity.title });
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(summary.getByText("NZD 199.00", { exact: true })).toBeVisible();
      await expect(summary.getByText("−NZD 50.00", { exact: true })).toBeVisible();
      await expect(summary.getByText("NZD 149.00", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await expect(page.getByText(promo.code)).toHaveCount(0);
    await page.getByRole("textbox", { name: "Full name", exact: true }).fill(booking.fullName);
    await page.getByRole("textbox", { name: "Email address", exact: true }).fill(booking.email);
    await page.getByRole("textbox", { name: "Confirm email address", exact: true }).fill(booking.email);
    await page.getByRole("checkbox", { name: /I agree to/ }).check();
    await page.getByRole("checkbox", { name: /I acknowledge/ }).check();
    await page.getByRole("button", { name: "Review booking", exact: true }).click();
    const review = page.getByRole("dialog");
    await expect(review.getByText("NZD 199.00", { exact: true })).toBeVisible();
    await expect(review.getByText("−NZD 50.00", { exact: true })).toBeVisible();
    await expect(review.getByText("NZD 149.00", { exact: true })).toBeVisible();

    await page.goto(`/booking/receipt/${booking.id}`);
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toHaveCount(0);
    await page.goto(`/booking/receipt/${randomUUID()}?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toHaveCount(0);
    await page.goto(`/booking/receipt/${booking.id}?token=${encodeURIComponent(token)}`);
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toBeVisible();
    await expect(page.getByText("Alex Morgan", { exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Original price" })).toBeVisible();
    await expect(page.getByText("NZD 199.00", { exact: true })).toBeVisible();
    await expect(page.getByText(`Code: ${promo.code}`)).toBeVisible();
    await expect(page.getByText("−NZD 50.00", { exact: true })).toBeVisible();
    await expect(page.getByText("Total paid", { exact: true })).toBeVisible();
    await expect(page.getByText("Total refunded", { exact: true })).toBeVisible();
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
