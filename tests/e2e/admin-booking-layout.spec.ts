import { expect, test } from "@playwright/test";

test("booking filters keep long class names compact and align on desktop", async ({ page }) => {
  await page.goto("/sign-in");
  // Exercise the shared stylesheet without depending on admin credentials or bookings.
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}<div class="workspace workspace-admin"><main style="grid-column: 1 / -1; padding: 24px; min-width: 0">
      <form method="get" class="admin-booking-filters">
        <input aria-label="Search attendee or email" placeholder="Search attendee or email" />
        <select name="classId" aria-label="Class"><option>New Zealand Immigration Refresher: Latest Updates &amp; Program Recap — 17 Nov 2026, 11:00 am</option></select>
        <select name="status" aria-label="Booking status"><option>All statuses</option></select>
        <button>Filter</button><a href="#">Clear</a>
      </form>
    </main></div>`);
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const boxes = await page.locator("form > *").evaluateAll(elements => elements.map(element => {
      const { top, height, width } = element.getBoundingClientRect();
      return { top, height, width };
    }));
    expect(new Set(boxes.map(box => box.top)).size).toBe(1);
    expect(boxes.every(box => box.height === 48)).toBe(true);
    expect(boxes[1].width).toBeGreaterThan(boxes[2].width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const search = await page.getByRole("textbox").boundingBox();
  const activity = await page.getByRole("combobox", { name: "Class", exact: true }).boundingBox();
  expect(activity!.y).toBeGreaterThan(search!.y);
  expect(activity!.height).toBe(48);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
