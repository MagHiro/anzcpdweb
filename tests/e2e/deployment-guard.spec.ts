import { test, expect } from "@playwright/test";

test("new release blocks interaction and reload opens the current page", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/version"), page.goto("/sign-in")]);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await page.route("**/api/version", route => route.fulfill({ json: { version: "new-deployment" } }));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText("Update available");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  expect(await page.getByRole("button", { name: "Sign in", exact: true }).evaluate(element => element.closest("dialog") === null && document.querySelector("dialog")?.matches(":modal"))).toBe(true);
  const result = await page.evaluate(async () => {
    try { await fetch("/api/auth/login", { method: "POST", body: "{}" }); return "sent"; } catch { return "blocked"; }
  });
  expect(result).toBe("blocked");
  await page.unroute("**/api/version");
  await dialog.getByRole("button", { name: "Reload page" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});

test("mutation preflight detects an update even before polling", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/version"), page.goto("/sign-in")]);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  let mutations = 0;
  await page.route("**/api/auth/login", route => { mutations++; return route.fulfill({ json: {} }); });
  await page.route("**/api/version", route => route.fulfill({ json: { version: "new-deployment" } }));
  await page.evaluate(async () => { try { await fetch("/api/auth/login", { method: "POST" }); } catch { /* Expected: update required. */ } });
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(mutations).toBe(0);
});

test("server rejects old and unversioned mutations", async ({ request }) => {
  for (const headers of [{}, { "x-app-version": "old-deployment" }] as Record<string, string>[]) {
    const response = await request.post("/api/account/profile", { headers, data: {} });
    expect(response.status()).toBe(409);
    expect(await response.json()).toMatchObject({ code: "DEPLOYMENT_UPDATED" });
  }
});

test("a deployment between preflight and submission shows the reload notice", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/version"), page.goto("/sign-in")]);
  await page.route("**/api/auth/login", route => route.fulfill({ status: 409, headers: { "x-app-version": "new-deployment" }, json: { code: "DEPLOYMENT_UPDATED" } }));
  const status = await page.evaluate(async () => (await fetch("/api/auth/login", { method: "POST" })).status);
  expect(status).toBe(409);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("cannot submit when the current deployment cannot be checked", async ({ page }) => {
  await Promise.all([page.waitForResponse("**/api/version"), page.goto("/sign-in")]);
  let mutations = 0;
  await page.route("**/api/auth/login", route => { mutations++; return route.fulfill({ json: {} }); });
  await page.route("**/api/version", route => route.abort());
  const result = await page.evaluate(async () => {
    try { await fetch("/api/auth/login", { method: "POST" }); return "sent"; } catch { return "blocked"; }
  });
  expect(result).toBe("blocked");
  expect(mutations).toBe(0);
});
