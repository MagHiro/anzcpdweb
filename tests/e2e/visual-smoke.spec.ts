import { test, expect } from "@playwright/test";

const paths = ["/", "/classes", "/australia", "/new-zealand", "/cpd-requirements", "/presenters", "/complaints", "/complaints/lodge", "/complaints/procedure", "/privacy", "/terms", "/refund-policy"];

for (const path of paths) {
  test("page renders without horizontal overflow: " + path, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "Horizontal overflow on " + path).toBeLessThanOrEqual(1);
  });
}

for (const path of ["/", "/classes", "/complaints", "/complaints/procedure"]) {
  test("mobile layout remains usable: " + path, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "Mobile horizontal overflow on " + path).toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-results/smoke-" + path.replaceAll("/", "-").replace(/^-/, "") + "-mobile.png", fullPage: true });
  });
}
