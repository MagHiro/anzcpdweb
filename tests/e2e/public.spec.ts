import { test, expect } from "@playwright/test";

test("public visitor can move through country and catalogue navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ANZ CPD/);
  await page.getByRole("link", { name: "Choose a country" }).click();
  await expect(page).toHaveURL(/\/australia/);
  await expect(page.getByRole("heading", { name: /Australian migration practice/ })).toBeVisible();
});

test.describe("database-backed journeys", () => {
  test.skip(!process.env.E2E_DATABASE_READY, "Set E2E_DATABASE_READY=1 after migrations and seed data for full browser journeys.");

  test("guest booking validates attendee details before Stripe Checkout", async ({ page }) => {
    await page.goto("/classes");
    await page.getByRole("link", { name: "View class" }).first().click();
    await page.getByRole("link", { name: "Book this class" }).click();
    await page.getByRole("button", { name: /Continue to secure payment/ }).click();
    await expect(page.getByText("Review the highlighted fields before continuing.")).toBeVisible();
  });

  test("customer cannot access another booking by changing the URL", async ({ page }) => {
    await page.goto("/account/bookings/00000000-0000-0000-0000-000000000000");
    await expect(page).not.toHaveURL(/00000000-0000-0000-0000-000000000000$/);
  });

  test("admin catalogue and customer authorization surfaces are protected", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/sign-in/);
  });
});
