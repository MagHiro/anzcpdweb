import { test, expect } from "@playwright/test";

test("homepage account panel and footer keep booking, support, and policy links within mobile bounds", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const account = page.getByRole("region", { name: "Already booked?" });
  await expect(account.getByRole("link", { name: "My account" })).toHaveAttribute("href", "/account");
  const footer = page.getByRole("contentinfo");
  const navigation = footer.getByRole("navigation", { name: "Footer navigation" });
  await expect(navigation.getByRole("link", { name: "All classes" })).toHaveAttribute("href", "/classes");
  await expect(navigation.getByRole("link", { name: "Complaints procedure" })).toHaveAttribute("href", "/complaints/procedure");
  await expect(navigation.getByRole("link", { name: "Refunds and cancellations" })).toHaveAttribute("href", "/refund-policy");
  await expect(footer.getByText(/ABN: 19700088526/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("homepage topics link to the guide and country-filtered classes", async ({ page }) => {
  await page.goto("/");
  const topics = page.getByRole("region", { name: "Browse by topic" });
  await expect(topics.getByRole("link", { name: "CPD guide" })).toHaveAttribute("href", "/cpd-requirements");
  const topic = topics.getByRole("list").getByRole("link").first();
  if (await topic.count()) {
    await expect(topic).toHaveAttribute("href", /^\/classes\?country=(AU|NZ)&category=.+/);
    await expect(topic.locator("svg")).toBeVisible();
  } else {
    await expect(topics.getByText(/No topics listed yet|Topics are temporarily unavailable/)).toBeVisible();
  }
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("homepage schedule has a clear heading and a responsive grid when classes are available", async ({ page }) => {
  await page.goto("/");
  const schedule = page.getByRole("region", { name: "Upcoming classes" });
  await expect(schedule.getByRole("link", { name: "View all classes" })).toHaveAttribute("href", "/classes");
  const cards = schedule.getByRole("article");
  if (await cards.count() === 0) {
    await expect(schedule.getByRole("heading", { name: /No upcoming classes|Classes are temporarily unavailable/ })).toBeVisible();
    return;
  }
  const first = cards.first();
  await expect(first.locator(".activity-card-schedule-header time")).toBeVisible();
  await expect(first.getByRole("link", { name: /^View details:/ })).toBeVisible();
  await expect(schedule.locator(".class-schedule-grid")).toHaveCSS("column-gap", "32px");
  await page.setViewportSize({ width: 375, height: 812 });
  const grid = schedule.locator(".class-schedule-grid");
  await expect(grid).toHaveCSS("grid-template-columns", /^\d+(?:\.\d+)?px$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("homepage uses a near-white canvas and a forest hero without country cards", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return { brand: style.getPropertyValue("--color-brand").trim(), canvas: getComputedStyle(document.body).backgroundColor };
  });
  expect(tokens).toEqual({ brand: "#14382c", canvas: "rgb(250, 252, 251)" });
  await expect(page.locator(".home-hero")).toHaveCSS("background-color", "rgb(20, 56, 44)");
  await expect(page.getByRole("link", { name: /^Explore (Australia|New Zealand)$/ })).toHaveCount(0);
  await expect(page.locator(".home-hero + section")).toHaveCSS("background-color", "rgb(250, 252, 251)");
  const hero = page.locator(".home-hero");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("CPD for migration practice");
  await expect(hero.getByRole("link", { name: "Browse classes" })).toHaveAttribute("href", "/classes");
  await expect(hero.getByRole("link", { name: "CPD requirements" })).toHaveAttribute("href", "/cpd-requirements");
  await expect(hero.getByText(/registered migration agents \(RMAs\), licensed immigration advisers \(LIAs\), and legal practices/)).toBeVisible();
  await expect(hero.locator(".home-hero-art")).toBeVisible();
  await expect(hero.getByRole("link", { name: "Browse classes" }).locator("svg[aria-hidden=true]")).toBeVisible();
});

test("homepage hero fits at narrow mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator(".home-hero h1")).toBeVisible();
  await expect(page.locator(".home-hero-art")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("catalogue filters sit above the results and remain collapsible", async ({ page }) => {
  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "CPD classes", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Activity dates" }).getByRole("link", { name: "Upcoming" })).toHaveAttribute("aria-current", "page");
  const toolbar = page.locator(".catalogue-toolbar");
  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("combobox", { name: "Display timezone" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Choose timezone" })).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Remove filter: migration" })).toBeVisible();
  await expect(page.locator(".catalogue-toolbar")).toHaveCSS("border-top-width", "0px");
  await expect(page.locator(".site-navigation").getByRole("link", { name: "Activities", exact: true })).toHaveAttribute("aria-current", "page");
});

test("class detail keeps schedule and booking ahead of the description on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/classes");
  let card = page.getByRole("link", { name: /^View details:/ }).first();
  if (!(await card.count())) {
    await page.goto("/classes?time=past");
    card = page.getByRole("link", { name: /^View details:/ }).first();
  }
  test.skip(!(await card.count()), "No published class in the catalogue");
  await card.click();

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(main.locator(".class-detail-hero p")).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "About the class" })).toBeVisible();
  await expect(main.getByRole("link", { name: "All classes" })).toHaveAttribute("href", "/classes");
  const schedule = main.getByRole("region", { name: "Schedule" });
  await expect(schedule.locator("time[datetime]")).toHaveCount(2);
  const booking = main.getByRole("complementary", { name: "Booking" });
  await expect(booking).toHaveCSS("position", "static");
  expect((await booking.boundingBox())!.x).toBeGreaterThan((await schedule.boundingBox())!.x);
  const bookLink = booking.getByRole("link", { name: "Book this class" });
  if (await bookLink.count()) {
    await expect(bookLink).toHaveAttribute("href", `${new URL(page.url()).pathname}/book`);
  } else {
    await expect(booking.getByRole("status")).toHaveText(/cancelled|sold out|closed/);
  }

  await page.setViewportSize({ width: 375, height: 812 });
  const about = main.getByRole("heading", { name: "About the class" });
  await expect(booking).toHaveCSS("position", "static");
  const [scheduleBox, bookingBox, aboutBox] = await Promise.all([schedule.boundingBox(), booking.boundingBox(), about.boundingBox()]);
  expect(scheduleBox!.y + scheduleBox!.height).toBeLessThan(bookingBox!.y);
  expect(bookingBox!.y + bookingBox!.height).toBeLessThan(aboutBox!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
