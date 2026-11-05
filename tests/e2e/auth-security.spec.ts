import { test, expect } from "@playwright/test";

test("raw auth endpoints cannot bypass the application security checks", async ({ request }) => {
  const { version } = await (await request.get("/api/version")).json();
  for (const path of ["sign-in/email", "sign-up/email", "request-password-reset", "change-password", "update-user", "send-verification-email"]) {
    const response = await request.post(`/api/auth/${path}`, { headers: { "x-app-version": version, origin: "http://127.0.0.1:3100" }, data: {} });
    expect(response.status()).toBe(404);
  }
});

test("auth routes reject cross-origin and missing-origin requests", async ({ request }) => {
  const { version } = await (await request.get("/api/version")).json();
  for (const origin of [undefined, "https://untrusted.example"]) {
    const headers: Record<string, string> = { "x-app-version": version };
    if (origin) headers.origin = origin;
    const response = await request.post("/api/auth/login", { headers, data: { email: "someone@example.com", password: "not-a-valid-password" } });
    expect(response.status()).toBe(403);
  }
});

test("sensitive pages and auth APIs are not cacheable and do not leak referrers", async ({ request }) => {
  for (const path of ["/sign-in", "/reset-password", "/api/auth/get-session"]) {
    const response = await request.get(path);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  }
});

test("sign in and sign out still work through the protected browser flow", async ({ page }) => {
  test.skip(!process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD, "Local credentials required");
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Email address" }).fill(process.env.ADMIN_TEST_EMAIL!);
  await page.locator('input[name="password"]').fill(process.env.ADMIN_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/(account|admin)/);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL(/sign-in/);
});
