import { test, expect } from "@playwright/test";

test("quiet editorial theme uses near-white canvas and academy pathways", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return { brand: style.getPropertyValue("--color-brand").trim(), canvas: getComputedStyle(document.body).backgroundColor };
  });
  expect(tokens).toEqual({ brand: "#14382c", canvas: "rgb(250, 252, 251)" });
  await expect(page.locator(".hero-path")).toHaveCount(2);
  await expect(page.locator(".hero-path").first()).toHaveCSS("border-radius", "32px");
  await expect(page.locator(".hero-path").first()).toHaveCSS("border-top-width", "0px");
  await expect(page.locator(".hero-path").first()).not.toHaveCSS("box-shadow", "none");
  await expect(page.locator(".home-pathways")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".home-hero + section")).toHaveCSS("background-color", "rgb(250, 252, 251)");
  await expect(page.locator(".home-hero h1")).toHaveCSS("font-size", "48px");
  await expect(page.locator(".home-hero h1")).toHaveCSS("line-height", "56px");
  await expect(page.locator(".hero-path h2").first()).toHaveCSS("font-size", "36px");
  await expect(page.getByRole("link", { name: "Explore New Zealand", exact: true })).toBeVisible();
});

test("home pathways stack at narrow mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator(".home-hero h1")).toHaveCSS("font-size", "32px");
  await expect(page.locator(".home-hero h1")).toHaveCSS("line-height", "40px");
  await expect(page.locator(".hero-path h2").first()).toHaveCSS("font-size", "26px");
  const panels = page.locator(".hero-path");
  await expect(panels.nth(0)).toBeVisible();
  await expect(panels.nth(1)).toBeVisible();
  const first = await panels.nth(0).boundingBox();
  const second = await panels.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("catalogue filters sit above the results and remain collapsible", async ({ page }) => {
  await page.goto("/classes");
  const toolbar = page.locator(".catalogue-toolbar");
  await expect(toolbar).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search activities" })).toBeVisible();
  await page.getByText("Search and filters", { exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Search activities" })).toBeHidden();
});

test("catalogue filter footer submits the search and preserves its value", async ({ page }) => {
  await page.goto("/classes");
  await page.getByRole("searchbox", { name: "Search activities" }).fill("migration");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/q=migration/);
  await expect(page.getByRole("searchbox", { name: "Search activities" })).toHaveValue("migration");
  await expect(page.locator(".catalogue-toolbar")).toHaveCSS("border-top-width", "0px");
  await expect(page.locator(".site-navigation").getByRole("link", { name: "Activities", exact: true })).toHaveAttribute("aria-current", "page");
});

for (const route of ["/", "/classes", "/australia", "/new-zealand", "/presenters", "/cpd-requirements", "/sign-in", "/register", "/forgot-password", "/reset-password", "/verify-email", "/privacy", "/terms", "/refund-policy", "/complaints", "/complaints/lodge", "/complaints/procedure", "/booking/success", "/booking/cancelled", "/booking/confirmation", "/account/setup"]) {
  test(`${route} renders within mobile bounds`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/Application error:|Internal Server Error|Invalid server environment/)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
