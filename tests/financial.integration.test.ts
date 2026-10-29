import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { accountClaimTokens, bookings, categories, classes, countries, payments, refunds, user } from "@/db/schema";
import { completeAccountLink, createAccountToken } from "@/server/auth/tokens";
import { markCheckoutCompleted, markCheckoutExpired, markCheckoutPaymentFailed } from "@/server/bookings/service";
import { cancelClass, deleteSourceReference, publishClass, replaceClassSources, saveSourceReference } from "@/server/catalogue/service";
import { syncPaymentRefundTotals, syncRefundFromStripe } from "@/server/payments/refunds";

describe.skipIf(!process.env.DATABASE_URL)("financial service regression tests", () => {
  let db: ReturnType<typeof getDb>;
  const classIds: string[] = [];
  const bookingIds: string[] = [];
  let categoryId: string;
  const userIds: string[] = [];
  const tokenEmails: string[] = [];

  beforeAll(async () => {
    db = getDb();
    await db.insert(countries).values({ code: "AU", name: "Australia", currency: "AUD", identifierType: "MARN", identifierLabel: "MARN", cpdUnitType: "POINTS", defaultTimezone: "Australia/Sydney", description: "Test" }).onConflictDoNothing();
    const [category] = await db.insert(categories).values({ country: "AU", name: "Financial tests", slug: randomUUID() }).returning();
    categoryId = category.id;
  });

  async function fixture(status: "EXPIRED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "PENDING_PAYMENT" = "EXPIRED") {
    const [record] = await db.insert(classes).values({ title: "Financial regression", slug: randomUUID(), country: "AU", categoryId, shortDescription: "Test", fullDescription: "Test", startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), timezone: "Australia/Sydney", bookingOpensAt: new Date(Date.now() - 1000), bookingClosesAt: new Date(Date.now() + 3600000), deliveryFormat: "ONLINE", priceMinorUnits: 10000, currency: "AUD", seatCapacity: 1, unlimitedCapacity: false, cpdUnitType: "POINTS", professionalIdentifierRequired: false, status: "PUBLISHED" }).returning();
    classIds.push(record.id);
    const checkoutId = `cs_${randomUUID()}`;
    const intentId = `pi_${randomUUID()}`;
    const [booking] = await db.insert(bookings).values({ classId: record.id, fullName: "Test", email: "financial-test@example.com", country: "AU", status, amountSnapshot: 10000, currencySnapshot: "AUD", classTitleSnapshot: record.title, timezoneSnapshot: record.timezone, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID(), stripeCheckoutSessionId: checkoutId, stripePaymentIntentId: intentId }).returning();
    bookingIds.push(booking.id);
    const [payment] = await db.insert(payments).values({ bookingId: booking.id, amountTotal: 10000, currency: "AUD", stripeCheckoutSessionId: checkoutId, stripePaymentIntentId: intentId, amountCaptured: status === "PARTIALLY_REFUNDED" ? 10000 : 0, status: status === "PARTIALLY_REFUNDED" ? "PARTIALLY_REFUNDED" : "PENDING" }).returning();
    const session = { id: checkoutId, metadata: { bookingId: booking.id }, amount_total: 10000, currency: "aud", payment_intent: intentId } as unknown as Stripe.Checkout.Session;
    return { record, booking, payment, session };
  }

  it("records late capture without overbooking a reused seat", async () => {
    const { record, booking, payment, session } = await fixture();
    const [other] = await db.insert(bookings).values({ classId: record.id, fullName: "Other", email: "other@example.com", country: "AU", status: "CONFIRMED", amountSnapshot: 10000, currencySnapshot: "AUD", classTitleSnapshot: record.title, timezoneSnapshot: record.timezone, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID() }).returning();
    bookingIds.push(other.id);
    const result = await markCheckoutCompleted({ session, paymentSucceeded: true });
    expect(result.confirmed).toBe(false);
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe("CANCELLED");
    expect((await db.select().from(payments).where(eq(payments.id, payment.id)))[0].amountCaptured).toBe(10000);
  });

  it("atomically cancels partially refunded bookings when their class is cancelled", async () => {
    const { record, booking } = await fixture("PARTIALLY_REFUNDED");
    await cancelClass(record.id);
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe("CANCELLED");
    expect((await db.select().from(classes).where(eq(classes.id, record.id)))[0].status).toBe("CANCELLED");
  });

  it("protects references attached to a class from deletion", async () => {
    const { record } = await fixture();
    const source = await saveSourceReference({ authority: "Test", title: "Protected reference", url: "https://example.com", jurisdiction: "AU", checkedAt: new Date() });
    try {
      await replaceClassSources(record.id, [source.id]);
      await expect(deleteSourceReference(source.id)).rejects.toThrow("attached to a class");
    } finally {
      await replaceClassSources(record.id, []);
      await deleteSourceReference(source.id);
    }
  });

  it("keeps drafts unchanged until category and venue requirements are met", async () => {
    const { record } = await fixture();
    await db.update(classes).set({ status: "DRAFT", deliveryFormat: "IN_PERSON", venueName: null, venueAddress: null }).where(eq(classes.id, record.id));
    await db.update(categories).set({ isActive: false, visibility: "HIDDEN" }).where(eq(categories.id, categoryId));
    try {
      await expect(publishClass(record.id)).rejects.toThrow("Admin → Categories");
      await db.update(categories).set({ isActive: true, visibility: "VISIBLE" }).where(eq(categories.id, categoryId));
      await expect(publishClass(record.id)).rejects.toThrow("venue name and venue address");
      expect((await db.select().from(classes).where(eq(classes.id, record.id)))[0].status).toBe("DRAFT");
      await db.update(classes).set({ venueName: "Test venue", venueAddress: "1 Test Street" }).where(eq(classes.id, record.id));
      expect((await publishClass(record.id)).status).toBe("PUBLISHED");
    } finally {
      await db.update(categories).set({ isActive: true, visibility: "VISIBLE" }).where(eq(categories.id, categoryId));
    }
  });

  it("requires online attendance details and refuses publishing cancelled classes", async () => {
    const { record } = await fixture();
    await db.update(classes).set({ status: "DRAFT", onlineAttendanceInfo: "   " }).where(eq(classes.id, record.id));
    await expect(publishClass(record.id)).rejects.toThrow("online attendance information");
    await db.update(classes).set({ onlineAttendanceInfo: "Joining instructions will be emailed." }).where(eq(classes.id, record.id));
    expect((await publishClass(record.id)).status).toBe("PUBLISHED");
    await cancelClass(record.id);
    await expect(publishClass(record.id)).rejects.toThrow("lifecycle state");
  });

  it("ignores terminal events from an old Checkout attempt", async () => {
    const { booking, session } = await fixture("PENDING_PAYMENT");
    await markCheckoutExpired({ ...session, id: "cs_old" });
    await markCheckoutPaymentFailed({ ...session, id: "cs_old" });
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe("PENDING_PAYMENT");
  });

  it("never downgrades a captured payment on a delayed unpaid event", async () => {
    const { booking, payment, session } = await fixture("CANCELLED");
    await markCheckoutCompleted({ session, paymentSucceeded: true });
    await markCheckoutCompleted({ session, paymentSucceeded: false });
    expect((await db.select().from(payments).where(eq(payments.id, payment.id)))[0].status).toBe("SUCCEEDED");
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe("CANCELLED");
  });

  it("does not restore attendance after partial refund of a cancelled booking", async () => {
    const { booking, payment, session } = await fixture("CANCELLED");
    await markCheckoutCompleted({ session, paymentSucceeded: true });
    await db.insert(refunds).values({ bookingId: booking.id, paymentId: payment.id, amount: 3000, currency: "AUD", reason: "Test", status: "SUCCEEDED", requestIdempotencyKey: randomUUID() });
    await syncPaymentRefundTotals(booking.id);
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe("CANCELLED");
    expect((await db.select().from(payments).where(eq(payments.id, payment.id)))[0].amountRefunded).toBe(3000);
  });

  it("rejects mismatched Stripe refund references instead of attaching by amount", async () => {
    const { booking, payment } = await fixture("PARTIALLY_REFUNDED");
    const [refund] = await db.insert(refunds).values({ bookingId: booking.id, paymentId: payment.id, amount: 3000, currency: "AUD", reason: "Test", requestIdempotencyKey: randomUUID() }).returning();
    await expect(syncRefundFromStripe({ id: `re_${randomUUID()}`, amount: 3000, currency: "aud", payment_intent: "pi_wrong", status: "succeeded", metadata: { localRefundId: refund.id, bookingId: booking.id } } as unknown as Stripe.Refund)).rejects.toThrow("does not match");
    expect((await db.select().from(refunds).where(eq(refunds.id, refund.id)))[0].stripeRefundId).toBeNull();
  });

  it("does not downgrade successful refunds when an older pending event arrives", async () => {
    const { booking, payment } = await fixture("PARTIALLY_REFUNDED");
    const stripeId = `re_${randomUUID()}`;
    const [refund] = await db.insert(refunds).values({ bookingId: booking.id, paymentId: payment.id, amount: 3000, currency: "AUD", reason: "Test", status: "SUCCEEDED", stripeRefundId: stripeId, requestIdempotencyKey: randomUUID() }).returning();
    await syncRefundFromStripe({ id: stripeId, amount: 3000, currency: "aud", payment_intent: payment.stripePaymentIntentId, status: "pending", metadata: { localRefundId: refund.id } } as unknown as Stripe.Refund);
    expect((await db.select().from(refunds).where(eq(refunds.id, refund.id)))[0].status).toBe("SUCCEEDED");
  });

  it("recovers setup and concurrent claims without transferring purchaser-owned bookings", async () => {
    const email = `claim-${randomUUID()}@example.com`;
    const ownerId = randomUUID();
    const purchaserId = randomUUID();
    userIds.push(ownerId, purchaserId);
    tokenEmails.push(email);
    await db.insert(user).values([{ id: ownerId, name: "Attendee", email, emailVerified: false }, { id: purchaserId, name: "Purchaser", email: `purchaser-${randomUUID()}@example.com`, emailVerified: true }]);
    const first = await fixture();
    const second = await fixture();
    await db.update(bookings).set({ email }).where(eq(bookings.id, first.booking.id));
    await db.update(bookings).set({ email, userId: purchaserId }).where(eq(bookings.id, second.booking.id));
    const setup = await createAccountToken({ email, purpose: "ACCOUNT_SETUP" });
    expect(await completeAccountLink(setup, "ACCOUNT_SETUP", email, ownerId)).toEqual({ linked: 1 });
    expect(await completeAccountLink(setup, "ACCOUNT_SETUP", email, ownerId)).toEqual({ linked: 0 });
    expect((await db.select().from(user).where(eq(user.id, ownerId)))[0].emailVerified).toBe(true);
    const claim = await createAccountToken({ email, purpose: "ACCOUNT_CLAIM" });
    const results = await Promise.all([completeAccountLink(claim, "ACCOUNT_CLAIM", email, ownerId), completeAccountLink(claim, "ACCOUNT_CLAIM", email, ownerId)]);
    expect(results).toEqual([{ linked: 0 }, { linked: 0 }]);
    expect(await completeAccountLink(claim, "ACCOUNT_CLAIM", email, purchaserId)).toBeNull();
    expect((await db.select().from(bookings).where(eq(bookings.id, second.booking.id)))[0].userId).toBe(purchaserId);
  });

  afterAll(async () => {
    if (bookingIds.length) {
      await db.delete(refunds).where(inArray(refunds.bookingId, bookingIds));
      await db.delete(payments).where(inArray(payments.bookingId, bookingIds));
      await db.delete(bookings).where(inArray(bookings.id, bookingIds));
    }
    if (classIds.length) await db.delete(classes).where(inArray(classes.id, classIds));
    if (categoryId) await db.delete(categories).where(eq(categories.id, categoryId));
    if (tokenEmails.length) await db.delete(accountClaimTokens).where(inArray(accountClaimTokens.email, tokenEmails));
    if (userIds.length) await db.delete(user).where(inArray(user.id, userIds));
  });
});
