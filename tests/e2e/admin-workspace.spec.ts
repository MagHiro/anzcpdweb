import { test, expect } from "@playwright/test";

let storage: Awaited<ReturnType<import("@playwright/test").APIRequestContext["storageState"]>>;
test.beforeAll(async ({ playwright }) => {
  const email = process.env.ADMIN_TEST_EMAIL;
  const password = process.env.ADMIN_TEST_PASSWORD;
  test.skip(!email || !password, "Local admin credentials required");
  const request = await playwright.request.newContext({ baseURL: "http://127.0.0.1:3100" });
  const response = await request.post("/api/auth/login", { data: { email, password }, headers: { origin: "http://127.0.0.1:3100" } });
  expect(response.ok()).toBe(true);
  storage = await request.storageState();
  await request.dispose();
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(storage.cookies);
});

test("all admin destinations render without application errors", async ({ page }) => {
  for (const route of ["", "/classes", "/categories", "/presenters", "/source-references", "/operations", "/bookings", "/customers", "/complaints", "/payments", "/refunds", "/audit-log", "/settings"]) {
    await page.goto(`/admin${route}`);
    await expect(page.locator(".workspace-content h1").first()).toBeVisible();
    await expect(page.getByText("This view couldn’t load", { exact: true })).toHaveCount(0);
    await expect(page.getByText("We couldn’t complete that request.", { exact: true })).toHaveCount(0);
  }
});

test("source editor validates, saves with feedback, and deletes with confirmation", async ({ page }) => {
  await page.goto("/admin/source-references");
  await page.getByRole("button", { name: "New reference", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("transform", "none");
  const modalBox = await dialog.boundingBox();
  expect(modalBox!.width).toBeGreaterThan(800);
  const authorityBox = await dialog.getByLabel("Authority", { exact: false }).boundingBox();
  const titleBox = await dialog.getByLabel("Title", { exact: false }).boundingBox();
  expect(authorityBox!.y).toBe(titleBox!.y);
  expect(authorityBox!.height).toBe(48);
  expect(await dialog.getByLabel("Jurisdiction", { exact: false }).evaluate(element => getComputedStyle(element).appearance)).toBe("base-select");
  await dialog.getByLabel("Jurisdiction", { exact: false }).click();
  await expect(dialog.getByRole("option", { name: "New Zealand", exact: true })).toHaveCSS("border-radius", "7px");
  await page.keyboard.press("Escape");
  const title = `Browser reference ${Date.now()}`;
  await dialog.getByLabel("Authority", { exact: false }).fill("Local test authority");
  await dialog.getByLabel("Title", { exact: false }).fill(title);
  await dialog.getByLabel("URL", { exact: false }).fill("https://example.com/source");
  await dialog.getByLabel("Date checked", { exact: false }).fill("2026-10-29");
  await dialog.getByRole("button", { name: "Add source reference" }).click();
  await expect(page.locator(".admin-toast-success").first()).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  const row = page.locator("article").filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog.getByText("Delete source reference?", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Delete reference", exact: true }).click();
  await expect(row).toHaveCount(0);
});

test("mobile navigation supports every destination without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin");
  const menu = page.getByRole("button", { name: "Menu", exact: false });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation", { name: "Administration" }).getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/settings/);
  await expect(page.getByRole("button", { name: "Menu", exact: false })).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
