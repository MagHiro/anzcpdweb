import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { bookings, categories, classes, countries, emailOutbox } from "@/db/schema";
import { getDb } from "@/lib/db";
import { enqueueEventReminders, refreshEventReminder, type EventReminderMessage } from "@/server/email/reminders";

describe.skipIf(!process.env.DATABASE_URL)("event reminder scheduling", () => {
  let db: ReturnType<typeof getDb>;
  const ids: string[] = [];
  const bookingIds: string[] = [];
  const emails: string[] = [];
  let categoryId: string;
  const now = new Date("2035-06-01T08:00:00Z");
  beforeAll(async () => {
    db = getDb();
    await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
    const [category] = await db.insert(categories).values({ country: "AU", name: "Reminder tests", slug: randomUUID() }).returning();
    categoryId = category.id;
  });
  async function fixture(days: number, status: typeof bookings.$inferSelect.status = "CONFIRMED", classStatus: typeof classes.$inferSelect.status = "PUBLISHED") {
    const [activity] = await db.insert(classes).values({ country: "AU", categoryId, title: "Reminder event", slug: randomUUID(), shortDescription: "Test", fullDescription: "Test", startAt: new Date(now.getTime() + days * 86400000), endAt: new Date(now.getTime() + days * 86400000 + 3600000), timezone: "Australia/Sydney", bookingOpensAt: now, bookingClosesAt: now, deliveryFormat: "ONLINE", meetingLink: "https://zoom.us/j/123", priceMinorUnits: 0, currency: "AUD", unlimitedCapacity: true, status: classStatus }).returning();
    ids.push(activity.id);
    const email = `reminder-${randomUUID()}@example.com`;
    emails.push(email);
    const [booking] = await db.insert(bookings).values({ classId: activity.id, fullName: "Alex Smith", email, country: "AU", status, amountSnapshot: 0, currencySnapshot: "AUD", classTitleSnapshot: activity.title, timezoneSnapshot: activity.timezone, termsAcceptedAt: now, refundPolicyAcceptedAt: now, idempotencyKey: randomUUID() }).returning();
    bookingIds.push(booking.id);
    return { activity, booking };
  }
  async function messages(email: string) {
    return db.select().from(emailOutbox).where(eq(emailOutbox.recipientEmail, email));
  }
  it("queues both intervals once, only for eligible bookings and classes", async () => {
    const three = await fixture(3);
    const one = await fixture(1, "PARTIALLY_REFUNDED", "SOLD_OUT");
    const excluded = await Promise.all([
      fixture(3, "PENDING_PAYMENT"), fixture(3, "PAYMENT_PROCESSING"), fixture(3, "CANCELLED"), fixture(1, "REFUNDED"),
      fixture(3, "CONFIRMED", "CANCELLED"), fixture(3, "CONFIRMED", "DRAFT"), fixture(2), fixture(-1),
    ]);
    await enqueueEventReminders(now);
    await enqueueEventReminders(now);
    await enqueueEventReminders(new Date(now.getTime() + 30000));
    expect(await messages(three.booking.email)).toHaveLength(1);
    expect((await messages(three.booking.email))[0].payload).toMatchObject({ daysBefore: 3, meetingLink: "https://zoom.us/j/123", classTitle: "Reminder event" });
    expect((await messages(one.booking.email))[0].payload).toMatchObject({ daysBefore: 1 });
    for (const item of excluded) expect(await messages(item.booking.email)).toHaveLength(0);
    await enqueueEventReminders(new Date(now.getTime() + 2 * 86400000));
    expect(await messages(three.booking.email)).toHaveLength(2);
  });
  it("rechecks cancellations, reschedules, expiry and current attendance information before delivery", async () => {
    const { activity, booking } = await fixture(3);
    await enqueueEventReminders(now);
    const message = (await messages(booking.email))[0].payload as EventReminderMessage;
    expect(await refreshEventReminder(message, now)).not.toBeNull();
    await db.update(classes).set({ meetingLink: "https://zoom.us/j/new" }).where(eq(classes.id, activity.id));
    expect(await refreshEventReminder(message, now)).toMatchObject({ meetingLink: "https://zoom.us/j/new" });
    await db.update(bookings).set({ status: "CANCELLED" }).where(eq(bookings.id, booking.id));
    expect(await refreshEventReminder(message, now)).toBeNull();
    await db.update(bookings).set({ status: "CONFIRMED" }).where(eq(bookings.id, booking.id));
    expect(await refreshEventReminder(message, new Date(now.getTime() + 3600000))).toBeNull();
    await db.update(classes).set({ startAt: new Date(activity.startAt.getTime() + 86400000), endAt: new Date(activity.endAt.getTime() + 86400000) }).where(eq(classes.id, activity.id));
    expect(await refreshEventReminder(message, now)).toBeNull();
  });
  afterAll(async () => {
    if (emails.length) await db.delete(emailOutbox).where(inArray(emailOutbox.recipientEmail, emails));
    if (bookingIds.length) await db.delete(bookings).where(inArray(bookings.id, bookingIds));
    if (ids.length) await db.delete(classes).where(inArray(classes.id, ids));
    if (categoryId) await db.delete(categories).where(eq(categories.id, categoryId));
  });
});
