import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { account, bookings, categories, classes, user } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

test("account bookings and admin pages are usable on desktop and mobile", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!process.env.DATABASE_URL, "Isolated database required");
  const db = getDb();
  const id = randomUUID();
  const email = `overview-${id}@example.com`;
  const password = `Test-${id}`;
  const name = "Overview Customer";
  const now = new Date();
  const [category] = await db.insert(categories).values({ country: "AU", name: `Overview test ${id}`, slug: id }).returning();

  try {
    await db.insert(user).values({ id, email, name, emailVerified: true });
    await db.insert(account).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: await hashPassword(password) });
    await page.goto("/sign-in");
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No upcoming classes" })).toBeVisible();

    const bookingIds: string[] = [];
    for (const [index, title] of ["Online migration workshop", "Melbourne migration workshop"].entries()) {
      const startAt = new Date(now.getTime() + (index + 1) * 86400000);
      const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title, slug: `${id}-${index}`, shortDescription: title, fullDescription: title, startAt, endAt: new Date(startAt.getTime() + 3600000), timezone: "Australia/Melbourne", bookingOpensAt: now, bookingClosesAt: startAt, deliveryFormat: index ? "IN_PERSON" : "ONLINE", venueName: index ? "Melbourne CBD" : null, meetingLink: index ? null : "https://example.com/webinar", priceMinorUnits: 0, currency: "AUD", unlimitedCapacity: true, status: "PUBLISHED" }).returning();
      const [booking] = await db.insert(bookings).values({ classId: activity.id, userId: id, fullName: name, email, country: "AU", status: "CONFIRMED", confirmedAt: now, amountSnapshot: 0, currencySnapshot: "AUD", classTitleSnapshot: title, timezoneSnapshot: activity.timezone, termsAcceptedAt: now, refundPolicyAcceptedAt: now, idempotencyKey: `${id}-${index}` }).returning();
      bookingIds.push(booking.id);
    }

    await page.reload();
    const next = page.getByRole("region", { name: "Next class" });
    await expect(next.getByRole("heading", { name: "Online migration workshop" })).toBeVisible();
    await expect(next.getByText("(Australia/Melbourne)", { exact: true })).toBeVisible();
    await expect(next.getByRole("link", { name: "View booking" })).toHaveAttribute("href", `/account/bookings/${bookingIds[0]}`);
    const later = page.getByRole("region", { name: "More upcoming classes" });
    await expect(later.getByText("Melbourne CBD", { exact: true })).toBeVisible();
    const bookingLink = later.getByRole("link", { name: /Melbourne migration workshop/ });
    await expect(bookingLink.getByText("View booking", { exact: true })).toBeVisible();
    for (const width of [1920, 1440, 1024, 768, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(await bookingLink.evaluate(link => link.getBoundingClientRect().width)).toBeLessThanOrEqual(672);
    }
    await bookingLink.click();
    await expect(page).toHaveURL(`/account/bookings/${bookingIds[1]}`);
    await expect(page.locator(".workspace-topbar")).toContainText("Booking details");
    await expect(page.getByRole("heading", { name: "How to attend" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View receipt" })).toHaveAttribute("href", `/booking/receipt/${bookingIds[1]}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    await menu.click();
    const navigation = page.getByRole("navigation", { name: "Account", exact: true });
    await expect(navigation.getByRole("link", { name: "Bookings" })).toHaveAttribute("aria-current", "location");
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(navigation).toBeHidden();
    await page.getByRole("link", { name: "Back to bookings" }).click();
    await page.getByRole("link", { name: "Upcoming", exact: true }).click();
    await expect(page.locator(".customer-booking-ticket").first()).toContainText("Online migration workshop");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.getByRole("link", { name: /Online migration workshop/ }).click();
    await expect(page.getByRole("link", { name: "Join webinar" })).toHaveAttribute("href", `/account/bookings/${bookingIds[0]}/join`);

    await db.update(bookings).set({ status: "PAYMENT_PROCESSING" }).where(eq(bookings.id, bookingIds[0]));
    await page.goto("/account");
    await expect(page.getByRole("link", { name: "Check payment for 1 booking" })).toHaveAttribute("href", "/account/bookings?view=attention");
    await expect(next.getByRole("heading", { name: "Melbourne migration workshop" })).toBeVisible();
    await db.update(user).set({ role: "ADMIN" }).where(eq(user.id, id));
    await page.goto("/admin");
    await expect(page.locator(".workspace-topbar").getByRole("link", { name: "View website" })).toHaveAttribute("href", "/");
    await menu.click();
    const adminNav = page.getByRole("navigation", { name: "Administration" });
    await expect(adminNav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await expect(adminNav.getByRole("link", { name: "Audit log" })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(adminNav.getByRole("link", { name: "Settings" })).toBeVisible();

    const [activity] = await db.select({ id: classes.id }).from(classes).where(eq(classes.slug, `${id}-0`));
    const classPath = `/admin/classes/${activity.id}`;
    const routes = [
      ["/admin/classes", "Classes"], ["/admin/classes/new", "Create a class"],
      ...["", "/participants", "/resources"].map(suffix => [classPath + suffix, "Online migration workshop"]),
      ["/admin/bookings", "Bookings"], ["/admin/bookings?view=classes", "Bookings"], [`/admin/bookings/${bookingIds[0]}`, name],
      ["/admin/categories", "Categories"], ["/admin/presenters", "Presenters"], ["/admin/source-references", "Source references"],
      ["/admin/customers", "Customers"], ["/admin/payments", "Payments"], ["/admin/refunds", "Refunds"],
      ["/admin/operations", "Queues"], ["/admin/audit-log", "Audit log"], ["/admin/complaints", "Complaints procedure"], ["/admin/settings", "Settings"],
    ];
    for (const [path, title] of routes) {
      await test.step(path, async () => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(path);
        const heading = page.locator(".admin-record-heading").getByRole("heading", { level: 1, name: title, exact: true });
        await expect(heading).toBeVisible();
        for (const width of [1440, 375]) {
          await page.setViewportSize({ width, height: 900 });
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        }
      });
    }
  } finally {
    await db.delete(bookings).where(eq(bookings.userId, id));
    await db.delete(classes).where(eq(classes.categoryId, category.id));
    await db.delete(categories).where(eq(categories.id, category.id));
    await db.delete(user).where(eq(user.id, id));
    await closeDb();
  }
});
