import { test, expect } from "@playwright/test";

for (const path of ["/admin", "/admin/payments", "/account", "/account/bookings"]) {
  test(`${path} still requires sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\?next=/);
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  });
}

test("legacy catalogue preserves filters on the canonical route", async ({ page }) => {
  await page.goto("/courses?country=Australia&q=ethics&type=Seminar");
  await expect(page).toHaveURL(/\/classes\?.*country=AU/);
  await expect(page.getByRole("searchbox", { name: "Search activities" })).toHaveValue("ethics");
  await page.getByRole("link", { name: "Past activities", exact: true }).click();
  await expect(page).toHaveURL(/time=past/);
  await expect(page).toHaveURL(/q=ethics/);
  await page.getByRole("link", { name: "Remove filter: ethics" }).click();
  await expect(page).not.toHaveURL(/q=ethics/);
});

test("sign-in labels and password visibility work", async ({ page }) => {
  await page.goto("/sign-in");
  const password = page.getByLabel(/^Password/);
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("account setup is accessible without a session and explains missing links", async ({ page }) => {
  await page.goto("/account/setup");
  await expect(page).toHaveURL(/\/account\/setup$/);
  await expect(page.getByRole("alert").filter({ hasText: "setup link is missing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Set up account", exact: true })).toBeDisabled();
});

test("payment return never claims a confirmed booking", async ({ page }) => {
  await page.goto("/booking/success");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We’re confirming your booking.");
  await expect(page.getByText(/do not pay again/)).toBeVisible();
});

test("mobile menu closes with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const path of ["/privacy", "/terms", "/refund-policy"]) {
  test(`${path} has accessible policy navigation and draft disclosure`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
    await expect(page.getByText(/draft requires completion/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
