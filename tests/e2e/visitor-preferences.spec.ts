import { test, expect } from "@playwright/test";

test.use({ timezoneId: "Pacific/Auckland" });

test("preferences open once a session, remain accessible, and remember choices", async ({ page }) => {
  await page.goto("/classes");
  const panel = page.getByRole("region", { name: "Country and timezone" });
  const bubble = page.getByRole("button", { name: "Choose country and timezone" });
  await expect(panel).toBeVisible();
  await expect(panel.getByLabel("Country", { exact: true })).toHaveValue("NZ");
  await expect(panel.getByLabel("Your timezone", { exact: true })).toHaveValue("");
  await expect(bubble).toContainText("Pacific/Auckland");
  await panel.getByLabel("Country", { exact: true }).selectOption("AU");
  await panel.getByRole("searchbox", { name: "Search cities and timezones" }).fill("Perth");
  await expect(panel.getByLabel("Your timezone", { exact: true }).locator("option")).toHaveCount(3);
  await panel.getByLabel("Your timezone", { exact: true }).selectOption("Australia/Perth");
  await expect(bubble).toContainText("Australia/Perth");
  await expect(panel.getByRole("link", { name: "Browse activities" })).toHaveAttribute("href", "/classes?country=AU");
  await panel.getByRole("button", { name: "Close country and timezone" }).click();
  await expect(panel).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(800);
  await expect(panel).toHaveCount(0);
  await bubble.click();
  await expect(panel).toBeVisible();
  await expect(panel.getByLabel("Your timezone", { exact: true })).toHaveValue("Australia/Perth");
  await expect(panel.getByLabel("Country", { exact: true })).toHaveValue("AU");
  await panel.getByLabel("Your timezone", { exact: true }).selectOption("");
  await expect(bubble).toContainText("Pacific/Auckland");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(bubble).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await bubble.click();
  await expect(panel).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
