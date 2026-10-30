import { test, expect } from "@playwright/test";

test("global styles cover native controls without changing their behavior", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator('input[type="email"]').fill("style-test@example.com");
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.id = "control-test";
    form.style.cssText = "max-width:600px;padding:24px";
    for (const type of ["text", "email", "password", "number", "tel", "url", "search", "date", "time", "datetime-local", "month", "week", "file", "color", "checkbox", "radio", "range", "hidden"]) {
      const input = document.createElement("input"); input.type = type; input.id = `test-${type}`; input.setAttribute("aria-label", type); form.append(input);
    }
    form.insertAdjacentHTML("beforeend", '<input type="checkbox" role="switch" aria-label="Toggle"><select aria-label="Single"><optgroup label="Group"><option>One</option><option>Two</option></optgroup></select><select multiple aria-label="Multiple"><option>One</option><option>Two</option></select><textarea aria-label="Notes"></textarea><button type="button">Test button</button>');
    document.body.append(form);
  });
  for (const type of ["text", "email", "password", "number", "tel", "url", "search", "date", "time", "datetime-local", "month", "week", "file", "color"]) {
    const control = page.locator(`#test-${type}`);
    await expect(control).toHaveCSS("border-top-style", "solid");
    expect(await control.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator("#test-hidden")).toBeHidden();
  await page.locator("#test-checkbox").check();
  await expect(page.locator("#test-checkbox")).toBeChecked();
  await page.getByRole("switch").check();
  await expect(page.getByRole("switch")).toBeChecked();
  await expect(page.getByRole("switch")).toHaveCSS("border-radius", "32px");
  await expect(page.getByRole("switch")).toHaveCSS("width", "44px");
  await page.getByLabel("Single", { exact: true }).selectOption({ label: "Two" });
  await expect(page.getByLabel("Single", { exact: true })).toHaveValue("Two");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#test-text").focus();
  await expect(page.locator("#test-text")).toHaveCSS("outline-style", "solid");
});
