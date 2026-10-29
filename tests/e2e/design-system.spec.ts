import { test, expect } from "@playwright/test";

test("editorial theme retains forest green and flat country panels", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return { brand: style.getPropertyValue("--color-brand").trim(), canvas: getComputedStyle(document.body).backgroundColor };
  });
  expect(tokens).toEqual({ brand: "#244c3b", canvas: "rgb(255, 255, 255)" });
  await expect(page.locator(".hero-path")).toHaveCount(2);
  await expect(page.locator(".hero-path").first()).toHaveCSS("border-radius", "22px");
  await expect(page.locator(".hero-path").first()).toHaveCSS("box-shadow", "none");
  await expect(page.getByRole("link", { name: "Explore New Zealand", exact: true })).toBeVisible();
});

test("home pathways stack at narrow mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const panels = page.locator(".hero-path");
  await expect(panels.nth(0)).toBeVisible();
  await expect(panels.nth(1)).toBeVisible();
  const first = await panels.nth(0).boundingBox();
  const second = await panels.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
