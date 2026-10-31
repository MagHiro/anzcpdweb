import { expect, test } from "@playwright/test";

test("CPD call to action keeps its dark surface and readable text", async ({ page }) => {
  await page.goto("/cpd-requirements");
  const cta = page.locator(".guide-cta");
  await expect(cta).toHaveCSS("background-color", "rgb(20, 56, 44)");
  await expect(cta.getByRole("heading")).toHaveCSS("color", "rgb(255, 255, 255)");
  await cta.getByRole("link", { name: "Browse classes" }).click();
  await expect(page).toHaveURL(/\/classes$/);
});

test("My account is a working account link", async ({ page }) => {
  await page.goto("/");
  const account = page.getByRole("link", { name: "My account", exact: true });
  await expect(account).toHaveAttribute("href", "/account");
  await account.click();
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});

test("password visibility control has an explicit transparent surface", async ({ page }) => {
  await page.goto("/sign-in");
  const toggle = page.getByRole("button", { name: "Show password" });
  await expect(toggle).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(toggle).toHaveCSS("color", "rgb(20, 56, 44)");
  await toggle.click();
  await expect(page.getByLabel(/^Password/)).toHaveAttribute("type", "text");
});

test("mobile account navigation remains clickable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "My account", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=/);
});
