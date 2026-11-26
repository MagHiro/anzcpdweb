import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { accountClaimTokens, bookings, categories, classes, classPromoCodes, countries, emailOutbox, paymentReceipts, payments, refunds, user } from "@/db/schema";
import { issuePaymentReceipt } from "@/server/payments/receipts";
import { receiptEmailAttachments, type EmailMessage } from "@/server/email/service";
import { completeAccountLink, createAccountToken } from "@/server/auth/tokens";
import { cancelBookingByAdmin, createBookingCheckout, markCheckoutCompleted, markCheckoutExpired, markCheckoutPaymentFailed } from "@/server/bookings/service";
import { cancelClass, deleteSourceReference, publishClass, replaceClassSources, saveSourceReference } from "@/server/catalogue/service";
import { syncPaymentRefundTotals, syncRefundFromStripe } from "@/server/payments/refunds";
import { getPublishedClassBySlug, getPublishedClasses } from "@/server/catalogue/queries";
import { makePublicBookingReference } from "@/lib/utils";
import { getBookingPromo, promoUsageCount } from "@/server/bookings/promos";
import * as stripe from "@/server/payments/stripe";

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

  it("confirms free bookings without Stripe, deduplicates retries, and enforces capacity", async () => {
    const { record, booking: unused } = await fixture("CANCELLED");
    await db.update(classes).set({ priceMinorUnits: 0, meetingLink: "https://meet.example.com/free-private" }).where(eq(classes.id, record.id));
    const input = { classSlug: record.slug, fullName: "Free attendee", email: `free-${randomUUID()}@example.com`, createAccountRequested: true, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID() };
    tokenEmails.push(input.email);
    const result = await createBookingCheckout(input);
    bookingIds.push(result.booking.id);
    expect(result.booking.id).not.toBe(unused.id);
    expect(result.booking.status).toBe("CONFIRMED");
    expect(result.booking.confirmedAt).not.toBeNull();
    expect(result.booking.paidAt).toBeNull();
    expect(result.booking.stripeCheckoutSessionId).toBeNull();
    expect(result.booking.seatReservationExpiresAt).toBeNull();
    expect(result.checkoutUrl).toMatch(/^\/booking\/confirmation\?token=/);
    const again = await createBookingCheckout(input);
    expect(again.booking.id).toBe(result.booking.id);
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, result.booking.id));
    expect(payment.status).toBe("SUCCEEDED");
    expect(payment.amountCaptured).toBe(0);
    const receipt = await issuePaymentReceipt(result.booking.id);
    expect(receipt?.amountPaid).toBe(0);
    expect((await issuePaymentReceipt(result.booking.id))?.id).toBe(receipt?.id);
    // Confirmation and account setup are queued through the regular fulfilment flow.
    const confirmations = await db.select().from(emailOutbox).where(eq(emailOutbox.recipientEmail, input.email));
    expect(confirmations.filter(message => message.messageType === "BOOKING_CONFIRMATION")).toHaveLength(1);
    expect(confirmations.find(message => message.messageType === "BOOKING_CONFIRMATION")?.payload).toMatchObject({ meetingLink: "https://meet.example.com/free-private" });
    expect(confirmations.filter(message => message.messageType !== "BOOKING_CONFIRMATION").every(message => !("meetingLink" in (message.payload as object)))).toBe(true);
    expect(confirmations.filter(message => message.messageType === "ACCOUNT_SETUP")).toHaveLength(1);
    const receiptMessages = confirmations.filter(message => message.messageType === "PAYMENT_RECEIPT");
    expect(receiptMessages).toHaveLength(1);
    expect((receiptMessages[0].payload as { noPaymentRequired: boolean }).noPaymentRequired).toBe(true);
    expect(await receiptEmailAttachments(receiptMessages[0].payload as EmailMessage)).toHaveLength(1);
    await expect(createBookingCheckout({ ...input, idempotencyKey: randomUUID() })).rejects.toThrow(/sold out/);
    await expect(createBookingCheckout({ ...input, email: "other@example.com" })).rejects.toThrow(/different attendee/);
  });

  it("issues one immutable receipt and one email only after successful payment", async () => {
    const { record, booking, session } = await fixture("PENDING_PAYMENT");
    const meetingLink = "https://meet.example.com/paid-private";
    await db.update(classes).set({ meetingLink }).where(eq(classes.id, record.id));
    expect(await getPublishedClassBySlug(record.slug)).not.toHaveProperty("meetingLink");
    const catalogue = await getPublishedClasses({ search: record.title });
    expect(catalogue.find(activity => activity.id === record.id)).not.toHaveProperty("meetingLink");
    expect(await issuePaymentReceipt(booking.id)).toBeNull();
    await markCheckoutCompleted({ session, paymentSucceeded: false });
    expect(await issuePaymentReceipt(booking.id)).toBeNull();
    expect(await db.select().from(emailOutbox).where(eq(emailOutbox.dedupeKey, `booking-confirmation:${makePublicBookingReference(booking.id)}`))).toHaveLength(0);
    await markCheckoutCompleted({ session, paymentSucceeded: true });
    const confirmationMessages = await db.select().from(emailOutbox).where(eq(emailOutbox.dedupeKey, `booking-confirmation:${makePublicBookingReference(booking.id)}`));
    expect(confirmationMessages.filter(message => (message.payload as { meetingLink?: string }).meetingLink === meetingLink)).toHaveLength(1);
    const original = await issuePaymentReceipt(booking.id);
    expect(original?.amountPaid).toBe(10000);
    await db.update(bookings).set({ fullName: "Changed contact", classTitleSnapshot: "Changed title" }).where(eq(bookings.id, booking.id));
    await markCheckoutCompleted({ session, paymentSucceeded: true });
    const repeated = await issuePaymentReceipt(booking.id);
    expect(repeated?.id).toBe(original?.id);
    expect(repeated?.recipientName).toBe("Test");
    expect(repeated?.classTitle).toBe("Financial regression");
    const messages = await db.select().from(emailOutbox).where(eq(emailOutbox.dedupeKey, `payment-receipt:${original?.id}`));
    expect(messages).toHaveLength(1);
    expect(messages[0].messageType).toBe("PAYMENT_RECEIPT");
    const message = messages[0].payload as EmailMessage;
    const attachments = await receiptEmailAttachments(message);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].contentType).toBe("application/pdf");
    expect(attachments[0].content.subarray(0, 5).toString()).toBe("%PDF-");
    if (message.type !== "PAYMENT_RECEIPT") throw new Error("Expected receipt email");
    const legacy = await receiptEmailAttachments({ ...message, receiptId: undefined });
    expect(legacy).toHaveLength(1);
    await expect(receiptEmailAttachments({ ...message, email: "other@example.com" })).rejects.toThrow("does not match");
  });

  it("only honours a hidden promo by link and sends the verified discount and code to Stripe", async () => {
    const { record } = await fixture("CANCELLED");
    const [activity] = await db.update(classes).set({ promoMode: "LINK_ONLY" }).where(eq(classes.id, record.id)).returning();
    const now = Date.now();
    const [promo] = await db.insert(classPromoCodes).values({
      classId: activity.id, code: "PRIVATE25", discountType: "PERCENT", discountValue: 25,
      validFrom: new Date(now - 60_000), validUntil: new Date(now + 60_000),
    }).returning();
    const input = {
      classSlug: activity.slug, fullName: "Promo attendee", email: `promo-${randomUUID()}@example.com`,
      createAccountRequested: false, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID(),
      expectedPrice: { amount: 7500, currency: "AUD", promoCodeId: promo.id },
    };
    tokenEmails.push(input.email);
    const link = { linkToken: promo.linkToken };
    await expect(getBookingPromo(db, activity, link, promo.validUntil)).resolves.toBeNull();
    await expect(createBookingCheckout({ ...input, promo: { code: promo.code } })).rejects.toThrow(/promo is unavailable/);
    await db.update(classes).set({ promoMode: "DISABLED" }).where(eq(classes.id, activity.id));
    await expect(createBookingCheckout({ ...input, promo: link })).rejects.toThrow(/promo is unavailable/);
    await db.update(classes).set({ promoMode: "LINK_ONLY" }).where(eq(classes.id, activity.id));
    await expect(createBookingCheckout({ ...input, promo: link, expectedPrice: { ...input.expectedPrice, amount: 1 } })).rejects.toThrow(/price or promo has changed/);

    const createSession = vi.fn().mockResolvedValue({ id: `cs_${randomUUID()}`, url: "https://checkout.stripe.com/test" });
    const stripeMock = vi.spyOn(stripe, "getStripe").mockReturnValue({ checkout: { sessions: { create: createSession } } } as unknown as Stripe);
    try {
      const result = await createBookingCheckout({ ...input, promo: link });
      bookingIds.push(result.booking.id);
      expect(result.booking).toMatchObject({ amountSnapshot: 7500, promoCodeId: promo.id, promoCodeSnapshot: "PRIVATE25", discountMinorUnits: 2500 });
      const metadata = { promoCode: "PRIVATE25", promoCodeId: promo.id, discountMinorUnits: "2500", originalAmountMinorUnits: "10000" };
      expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
        line_items: [expect.objectContaining({ price_data: expect.objectContaining({ currency: "aud", unit_amount: 7500 }) })],
        metadata: expect.objectContaining(metadata),
        payment_intent_data: { metadata: expect.objectContaining(metadata) },
      }), expect.anything());
      const [payment] = await db.select().from(payments).where(eq(payments.bookingId, result.booking.id));
      expect(payment.amountTotal).toBe(7500);
    } finally {
      stripeMock.mockRestore();
    }
  });

  it("shares the promo cap between links and manual codes and serializes the last use", async () => {
    const { record } = await fixture("CANCELLED");
    const [activity] = await db.update(classes).set({ promoMode: "CODE_AND_LINK", unlimitedCapacity: true }).where(eq(classes.id, record.id)).returning();
    const [promo] = await db.insert(classPromoCodes).values({
      classId: activity.id, code: "LAST25", discountType: "PERCENT", discountValue: 25, maxUses: 1,
      validFrom: activity.bookingOpensAt, validUntil: activity.bookingClosesAt,
    }).returning();
    const link = { linkToken: promo.linkToken };
    const code = { code: promo.code };
    const base = {
      classSlug: activity.slug, fullName: "Promo attendee", createAccountRequested: false,
      termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(),
    };
    const inputs = [link, code].map(source => ({
      ...base, promo: source, email: `limit-${randomUUID()}@example.com`, idempotencyKey: randomUUID(),
    }));
    tokenEmails.push(...inputs.map(input => input.email));
    const createSession = vi.fn(async () => ({ id: `cs_${randomUUID()}`, url: "https://checkout.stripe.com/test", status: "open" }));
    const retrieveSession = vi.fn(async (id: string) => ({ id, url: "https://checkout.stripe.com/test", status: "open" }));
    const stripeMock = vi.spyOn(stripe, "getStripe").mockReturnValue({ checkout: { sessions: { create: createSession, retrieve: retrieveSession } } } as unknown as Stripe);
    try {
      const attempts = await Promise.allSettled(inputs.map(input => createBookingCheckout(input)));
      const winnerIndex = attempts.findIndex(attempt => attempt.status === "fulfilled");
      const winner = attempts[winnerIndex];
      if (winner?.status !== "fulfilled") throw new Error("One checkout should have reserved the promo.");
      const booking = winner.value.booking;
      bookingIds.push(booking.id);
      expect(attempts[1 - winnerIndex]).toMatchObject({ status: "rejected", reason: expect.objectContaining({ message: expect.stringContaining("promo is unavailable") }) });
      expect(createSession).toHaveBeenCalledTimes(1);
      await expect(createBookingCheckout(inputs[winnerIndex])).resolves.toMatchObject({ reused: true, booking: { id: booking.id } });
      expect(createSession).toHaveBeenCalledTimes(1);
      await expect(getBookingPromo(db, activity, link)).resolves.toBeNull();
      await expect(getBookingPromo(db, activity, code)).resolves.toBeNull();
      const [usage] = await db.select({ count: promoUsageCount }).from(classPromoCodes).where(eq(classPromoCodes.id, promo.id));
      expect(usage.count).toBe(1);

      await cancelBookingByAdmin(booking.id);
      await expect(getBookingPromo(db, activity, link)).resolves.toBeNull();
      if (!booking.stripeCheckoutSessionId) throw new Error("Expected a Stripe session for the reserved booking.");
      await markCheckoutExpired({ id: booking.stripeCheckoutSessionId, metadata: { bookingId: booking.id } } as unknown as Stripe.Checkout.Session);
      await expect(getBookingPromo(db, activity, code)).resolves.toMatchObject({ quote: { amount: 7500 } });

      const replacement = await createBookingCheckout(inputs[1 - winnerIndex]);
      bookingIds.push(replacement.booking.id);
      if (!replacement.booking.stripeCheckoutSessionId) throw new Error("Expected a Stripe session for the replacement booking.");
      const paidSession = { id: replacement.booking.stripeCheckoutSessionId, metadata: { bookingId: replacement.booking.id }, amount_total: 7500, currency: "aud" } as unknown as Stripe.Checkout.Session;
      await markCheckoutCompleted({ session: paidSession, paymentSucceeded: true });
      await db.update(payments).set({ status: "REFUNDED", amountRefunded: 7500 }).where(eq(payments.bookingId, replacement.booking.id));
      await expect(getBookingPromo(db, activity, link)).resolves.toBeNull();
    } finally {
      stripeMock.mockRestore();
    }
  });

  it("records late capture without overbooking a reused seat", async () => {
    const { record, booking, payment, session } = await fixture();
    const [other] = await db.insert(bookings).values({ classId: record.id, fullName: "Other", email: "other@example.com", country: "AU", status: "CONFIRMED", amountSnapshot: 10000, currencySnapshot: "AUD", classTitleSnapshot: record.title, timezoneSnapshot: record.timezone, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: randomUUID() }).returning();
    bookingIds.push(other.id);
    const result = await markCheckoutCompleted({ session, paymentSucceeded: true });
    expect(result.confirmed).toBe(false);
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe("CANCELLED");
    expect((await db.select().from(payments).where(eq(payments.id, payment.id)))[0].amountCaptured).toBe(10000);
    expect((await issuePaymentReceipt(booking.id))?.amountPaid).toBe(10000);
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

  it("publishes Australian classes priced in NZD", async () => {
    const { record } = await fixture();
    await db.update(classes).set({ status: "DRAFT", currency: "NZD", onlineAttendanceInfo: "Joining instructions will be emailed." }).where(eq(classes.id, record.id));
    const published = await publishClass(record.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.country).toBe("AU");
    expect(published.currency).toBe("NZD");
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
      await db.delete(paymentReceipts).where(inArray(paymentReceipts.bookingId, bookingIds));
      await db.delete(refunds).where(inArray(refunds.bookingId, bookingIds));
      await db.delete(payments).where(inArray(payments.bookingId, bookingIds));
      await db.delete(bookings).where(inArray(bookings.id, bookingIds));
    }
    if (classIds.length) await db.delete(classes).where(inArray(classes.id, classIds));
    if (categoryId) await db.delete(categories).where(eq(categories.id, categoryId));
    if (tokenEmails.length) {
      await db.delete(accountClaimTokens).where(inArray(accountClaimTokens.email, tokenEmails));
      await db.delete(emailOutbox).where(inArray(emailOutbox.recipientEmail, tokenEmails));
    }
    if (userIds.length) await db.delete(user).where(inArray(user.id, userIds));
  });
});
