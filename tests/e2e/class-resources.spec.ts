import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { account, bookings, categories, classes, user } from "@/db/schema";
import { getDb } from "@/lib/db";

test("class resources are draft by default and downloads require an active owned booking", async ({ page, playwright }) => {
  test.setTimeout(60000);
  test.skip(!process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD || !process.env.DATABASE_URL, "Local credentials required");
  const db = getDb();
  const id = randomUUID(), password = `Test-${randomUUID()}`, email = `resources-${id}@example.com`;
  const [category] = await db.insert(categories).values({ country: "AU", name: "Resources test", slug: id }).returning();
  const [activity] = await db.insert(classes).values({ country: "AU", categoryId: category.id, title: "Resources test", slug: id, shortDescription: "Test", fullDescription: "Test", startAt: new Date(), endAt: new Date(Date.now() + 3600000), timezone: "Australia/Sydney", bookingOpensAt: new Date(), bookingClosesAt: new Date(), deliveryFormat: "ONLINE", priceMinorUnits: 0, currency: "AUD", unlimitedCapacity: true, status: "PUBLISHED" }).returning();
  await db.insert(user).values({ id, name: "Resource customer", email, emailVerified: true });
  await db.insert(account).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: await hashPassword(password) });
  const [booking] = await db.insert(bookings).values({ classId: activity.id, userId: id, fullName: "Customer", email, country: "AU", status: "CONFIRMED", amountSnapshot: 0, currencySnapshot: "AUD", classTitleSnapshot: activity.title, timezoneSnapshot: activity.timezone, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: id }).returning();
  const customer = await playwright.request.newContext({ baseURL: "http://127.0.0.1:3100" });
  let resourceId: string | undefined;
  try {
    const { version } = await (await page.request.get("/api/version")).json();
    const headers = { origin: "http://127.0.0.1:3100", "x-app-version": version };
    expect((await page.request.post("/api/auth/login", { headers, data: { email: process.env.ADMIN_TEST_EMAIL, password: process.env.ADMIN_TEST_PASSWORD } })).ok()).toBe(true);
    expect((await customer.post("/api/auth/login", { headers, data: { email, password } })).ok()).toBe(true);
    await page.goto(`/admin/classes/${activity.id}`);
    await expect(page.getByRole("heading", { name: "Materials and recordings", exact: true })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Class workspace" }).getByRole("link", { name: "Materials & recordings" }).click();
    await expect(page).toHaveURL(`/admin/classes/${activity.id}/resources`);
    await page.getByRole("textbox", { name: "Resource title", exact: true }).fill("Workshop notes");
    await page.getByLabel("PDF file (up to 5 MB)").setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
    await page.getByRole("button", { name: "Add draft resource" }).click();
    const preview = page.getByRole("link", { name: "Workshop notes", exact: true });
    await expect(preview).toBeVisible();
    const href = (await preview.getAttribute("href"))!;
    resourceId = href.split("/").pop();
    expect((await customer.get(href)).status()).toBe(404);
    expect((await page.request.get(href)).status()).toBe(200);
    const resourceRow = page.getByRole("listitem").filter({ hasText: "Workshop notes" });
    await resourceRow.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(resourceRow.getByRole("button", { name: "Unpublish" })).toBeVisible();
    const download = await customer.get(href);
    expect(download.status()).toBe(200);
    expect(download.headers()["cache-control"]).toContain("no-store");
    expect((await download.body()).toString()).toContain("%PDF-");
    expect((await customer.get(`/account/bookings/${booking.id}`)).status()).toBe(200);
    await db.update(bookings).set({ status: "CANCELLED" }).where(eq(bookings.id, booking.id));
    expect((await customer.get(href)).status()).toBe(404);
    expect((await customer.post("/api/admin/class-resources", { headers, multipart: { classId: activity.id, action: "publish", resourceId: resourceId! } })).status()).toBe(403);
    await resourceRow.getByRole("button", { name: "Unpublish" }).click();
    await expect(resourceRow.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: "Resource title", exact: true }).fill("Session replay");
    await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("RECORDING");
    await page.getByRole("textbox", { name: "Recording URL" }).fill("https://video.example.com/private-replay");
    await page.getByRole("button", { name: "Add draft resource" }).click();
    const recordingRow = page.getByRole("listitem").filter({ hasText: "Session replay" });
    await recordingRow.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(recordingRow.getByRole("button", { name: "Unpublish" })).toBeVisible();
    await db.update(bookings).set({ status: "CONFIRMED" }).where(eq(bookings.id, booking.id));
    const recordingHref = (await recordingRow.getByRole("link", { name: "Session replay" }).getAttribute("href"))!;
    const recording = await customer.get(recordingHref, { maxRedirects: 0 });
    expect(recording.status()).toBe(302);
    expect(recording.headers().location).toBe("https://video.example.com/private-replay");
    await db.update(bookings).set({ userId: null }).where(eq(bookings.id, booking.id));
    expect((await customer.get(recordingHref, { maxRedirects: 0 })).status()).toBe(404);
  } finally {
    if (resourceId) {
      const { version } = await (await page.request.get("/api/version")).json();
      await page.request.post("/api/admin/class-resources", { headers: { origin: "http://127.0.0.1:3100", "x-app-version": version }, multipart: { classId: activity.id, action: "remove", resourceId } });
    }
    await customer.dispose();
    await db.delete(bookings).where(eq(bookings.id, booking.id));
    await db.delete(user).where(eq(user.id, id));
    await db.delete(classes).where(eq(classes.id, activity.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});
