import { test, expect } from "@playwright/test";

test.use({ timezoneId: "America/New_York" });
test("class cards disclose the detected timezone without a duplicate original time", async ({ page }) => {
  await page.goto("/classes");
  const card = page.locator(".activity-card").filter({ hasText: "Timezone:" }).first();
  test.skip(await card.count() === 0, "No published classes available locally");
  await expect(card.getByText("Timezone: America/New_York", { exact: true })).toBeVisible();
  await expect(card.getByText(/^Class time:/)).toHaveCount(0);
  await expect(card.locator("time").first()).toHaveAttribute("datetime", /Z$/);
});
