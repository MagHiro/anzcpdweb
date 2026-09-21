import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, categories, classes, countries, webhookEvents } from "@/db/schema";

const enabled = Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("PostgreSQL booking invariants", () => {
  let db: ReturnType<typeof getDb>;
  let classId = "";
  let categoryId = "";

  beforeAll(async () => {
    db = getDb();
    await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
    const [category] = await db.insert(categories).values({ country: "AU", name: `Race test ${Date.now()}`, slug: `race-test-${Date.now()}` }).returning({ id: categories.id });
    categoryId = category.id;
    const [record] = await db.insert(classes).values({ title: "Concurrency test", slug: `concurrency-${Date.now()}`, country: "AU", categoryId, shortDescription: "Test class", fullDescription: "Test class for seat concurrency.", startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), timezone: "Australia/Sydney", bookingOpensAt: new Date(Date.now() - 1000), bookingClosesAt: new Date(Date.now() + 3600000), deliveryFormat: "ONLINE", onlineAttendanceInfo: "Test", priceMinorUnits: 100, currency: "AUD", seatCapacity: 1, unlimitedCapacity: false, cpdUnitType: "POINTS", cpdUnitAmount: "1", professionalIdentifierRequired: false, status: "PUBLISHED" }).returning({ id: classes.id });
    classId = record.id;
  });

  it("keeps the processed webhook event unique", async () => {
    const eventId = `evt_test_${Date.now()}`;
    const first = await db.insert(webhookEvents).values({ stripeEventId: eventId, type: "checkout.session.completed", status: "RECEIVED" }).onConflictDoNothing({ target: webhookEvents.stripeEventId }).returning({ id: webhookEvents.id });
    const second = await db.insert(webhookEvents).values({ stripeEventId: eventId, type: "checkout.session.completed", status: "RECEIVED" }).onConflictDoNothing({ target: webhookEvents.stripeEventId }).returning({ id: webhookEvents.id });
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it("allows no more than one active booking for a one-seat class under row locking", async () => {
    const reserve = async (index: number) => db.transaction(async (tx) => {
      const [locked] = await tx.select().from(classes).where(eq(classes.id, classId)).for("update").limit(1);
      const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(bookings).where(and(eq(bookings.classId, classId), eq(bookings.status, "CONFIRMED")));
      if (Number(count) >= (locked.seatCapacity ?? 0)) return false;
      await tx.insert(bookings).values({ classId, fullName: `Race ${index}`, email: `race-${index}@example.com`, country: "AU", status: "CONFIRMED", amountSnapshot: 100, currencySnapshot: "AUD", classTitleSnapshot: locked.title, timezoneSnapshot: locked.timezone, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: `race-${Date.now()}-${index}` });
      return true;
    });
    const results = await Promise.all([reserve(1), reserve(2)]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  afterAll(async () => {
    await db.delete(bookings).where(eq(bookings.classId, classId));
    await db.delete(classes).where(eq(classes.id, classId));
    await db.delete(categories).where(eq(categories.id, categoryId));
  });
});
