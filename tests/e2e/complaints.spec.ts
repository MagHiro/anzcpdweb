import { test, expect } from "@playwright/test";
test("complaints information is available to public visitors", async ({ page }) => {
  await page.goto("/complaints");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your concerns");
  await expect(page.getByText("Within 3 business days")).toBeVisible();
  await page.getByRole("link", { name: "Read the full procedure" }).click();
  await expect(page).toHaveURL(/\/complaints\/procedure$/);
  await expect(page.getByRole("heading", { name: "VCAT determination" })).toBeVisible();
});
test("formal complaint instructions explain required details without collecting them", async ({ page }) => {
  await page.goto("/complaints/lodge");
  await expect(page.getByText(/main applicant’s name and date of birth/i)).toBeVisible();
  const link = page.getByRole("link", { name: "Email a formal complaint" });
  await expect(link).toHaveAttribute("href", /mailto:info@anzmigrationacademy\.com\?subject=Complaint/);
  await expect(page.locator("form")).toHaveCount(0);
});
test("complaint staff checklist requires admin sign-in", async ({ page }) => {
  await page.goto("/admin/complaints");
  await expect(page).toHaveURL(/\/sign-in\?next=/);
});
