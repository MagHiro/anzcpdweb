import { and, eq, inArray, or, sql } from "drizzle-orm";
import { bookings, classes, emailOutbox, payments } from "@/db/schema";
import { getCountryConfig } from "@/lib/domain/countries";
import { professionalIdentifierSchema } from "@/lib/validation";
import { getDb, type Database } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { formatDateTime, formatMoney, makePublicBookingReference } from "@/lib/utils";
import { createAccountToken } from "@/server/auth/tokens";
import { queueEmail } from "@/server/email/service";
import { getStripe } from "@/server/payments/stripe";
import { assertBookingTransition } from "@/server/bookings/transitions";

const reservationStatuses = ["PENDING_PAYMENT", "PAYMENT_PROCESSING"] as const;
const seatHoldingStatuses = ["CONFIRMED", "PARTIALLY_REFUNDED"] as const;

type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type QueryExecutor = Database | Transaction;

export type CreateCheckoutInput = {
  classSlug: string;
  userId?: string;
  fullName: string;
  email: string;
  professionalIdentifier?: string;
  createAccountRequested: boolean;
  termsAcceptedAt: Date;
  refundPolicyAcceptedAt: Date;
  idempotencyKey: string;
};

async function activeSeatCount(tx: QueryExecutor, classId: string): Promise<number> {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, classId),
        or(inArray(bookings.status, seatHoldingStatuses), inArray(bookings.status, reservationStatuses)),
      ),
    );
  return Number(row?.count ?? 0);
}

async function refreshCapacityStatus(tx: QueryExecutor, classId: string, now: Date): Promise<void> {
  const [classRecord] = await tx.select().from(classes).where(eq(classes.id, classId)).for("update").limit(1);
  if (!classRecord || classRecord.unlimitedCapacity || !classRecord.seatCapacity) return;
  const seats = await activeSeatCount(tx, classId);
  const nextStatus = seats >= classRecord.seatCapacity && classRecord.status === "PUBLISHED" ? "SOLD_OUT" : seats < classRecord.seatCapacity && classRecord.status === "SOLD_OUT" ? "PUBLISHED" : classRecord.status;
  if (nextStatus !== classRecord.status) await tx.update(classes).set({ status: nextStatus, updatedAt: now }).where(eq(classes.id, classId));
}

export async function createBookingCheckout(input: CreateCheckoutInput) {
  const db = getDb();
  const createAccountRequested = !input.userId && input.createAccountRequested;
  const existing = await db.select().from(bookings).where(eq(bookings.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing[0] && ["CONFIRMED", "PAYMENT_PROCESSING"].includes(existing[0].status)) throw new Error("This booking is already being processed. Check your account before trying to pay again.");
  if (existing[0]?.stripeCheckoutSessionId) {
    const session = await getStripe().checkout.sessions.retrieve(existing[0].stripeCheckoutSessionId);
    if (session.status === "open" && session.url) return { booking: existing[0], checkoutUrl: session.url, reused: true };
  }

  const created = await db.transaction(async (tx) => {
    const [alreadyCreated] = await tx.select().from(bookings).where(eq(bookings.idempotencyKey, input.idempotencyKey)).for("update").limit(1);
    if (alreadyCreated) {
      if (["PAYMENT_FAILED", "EXPIRED"].includes(alreadyCreated.status)) {
        const [classRecord] = await tx.select().from(classes).where(eq(classes.id, alreadyCreated.classId)).for("update").limit(1);
        if (!classRecord || !["PUBLISHED", "SOLD_OUT"].includes(classRecord.status)) throw new Error("This class is no longer available for booking.");
        const now = new Date();
        if (now < classRecord.bookingOpensAt) throw new Error("Booking has not opened for this class yet.");
        if (now > classRecord.bookingClosesAt || now >= classRecord.startAt) throw new Error("Booking is closed for this class.");
        if (!classRecord.unlimitedCapacity) {
          const seats = await activeSeatCount(tx, classRecord.id);
          if (!classRecord.seatCapacity || seats >= classRecord.seatCapacity) throw new Error("This class has sold out. Please return to the class page for the latest availability.");
        }
        const reservationExpiresAt = new Date(now.getTime() + 31 * 60 * 1000);
        const [reopened] = await tx.update(bookings).set({ status: "PENDING_PAYMENT", seatReservationExpiresAt: reservationExpiresAt, expiredAt: null, updatedAt: now }).where(eq(bookings.id, alreadyCreated.id)).returning();
        await tx.update(payments).set({ status: "PENDING", updatedAt: now }).where(eq(payments.bookingId, alreadyCreated.id));
        await refreshCapacityStatus(tx, classRecord.id, now);
        return reopened ?? alreadyCreated;
      }
      return alreadyCreated;
    }

    const [classRecord] = await tx.select().from(classes).where(eq(classes.slug, input.classSlug)).for("update").limit(1);
    if (!classRecord) throw new Error("This class is no longer available.");
    if (!["PUBLISHED", "SOLD_OUT"].includes(classRecord.status)) throw new Error("This class is no longer available for booking.");
    const now = new Date();
    if (now < classRecord.bookingOpensAt) throw new Error("Booking has not opened for this class yet.");
    if (now > classRecord.bookingClosesAt || now >= classRecord.startAt) throw new Error("Booking is closed for this class.");
    if (!classRecord.unlimitedCapacity) {
      const seats = await activeSeatCount(tx, classRecord.id);
      if (!classRecord.seatCapacity || seats >= classRecord.seatCapacity) throw new Error("This class has sold out. Please return to the class page for the latest availability.");
    }
    const reservationExpiresAt = new Date(now.getTime() + 31 * 60 * 1000);

    const country = getCountryConfig(classRecord.country);
    if (classRecord.currency !== country.currency) throw new Error("This class has an invalid country and currency configuration. Please contact support.");
    const identifier = input.professionalIdentifier?.trim() || null;
    const identifierValidation = professionalIdentifierSchema(classRecord.country, classRecord.professionalIdentifierRequired).safeParse(identifier ?? "");
    if (!identifierValidation.success) throw new Error(identifierValidation.error.issues[0]?.message ?? "Enter the professional identifier in the requested format.");
    const [booking] = await tx
      .insert(bookings)
      .values({
        userId: input.userId,
        classId: classRecord.id,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        country: classRecord.country,
        professionalIdentifierType: classRecord.professionalIdentifierRequired ? country.identifierType : identifier ? country.identifierType : null,
        professionalIdentifier: identifier,
        createAccountRequested,
        status: "PENDING_PAYMENT",
        amountSnapshot: classRecord.priceMinorUnits,
        currencySnapshot: classRecord.currency,
        classTitleSnapshot: classRecord.title,
        cpdUnitTypeSnapshot: classRecord.cpdUnitType,
        cpdAmountSnapshot: classRecord.cpdUnitAmount,
        timezoneSnapshot: classRecord.timezone,
        seatReservationExpiresAt: reservationExpiresAt,
        termsAcceptedAt: input.termsAcceptedAt,
        refundPolicyAcceptedAt: input.refundPolicyAcceptedAt,
        idempotencyKey: input.idempotencyKey,
      })
      .returning();
    if (!booking) throw new Error("We could not save the booking. Please try again.");
    await tx.insert(payments).values({
      bookingId: booking.id,
      amountTotal: booking.amountSnapshot,
      currency: booking.currencySnapshot,
      status: "PENDING",
    });
    await refreshCapacityStatus(tx, classRecord.id, now);
    return booking;
  });

  if (created.stripeCheckoutSessionId) {
    const existingSession = await getStripe().checkout.sessions.retrieve(created.stripeCheckoutSessionId);
    if (existingSession.status === "open" && existingSession.url) return { booking: created, checkoutUrl: existingSession.url, reused: true };
  }

  let stripeSession: import("stripe").default.Checkout.Session | undefined;
  try {
    const env = getServerEnv();
    stripeSession = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: created.currencySnapshot.toLowerCase(),
              unit_amount: created.amountSnapshot,
              product_data: { name: created.classTitleSnapshot, metadata: { classId: created.classId } },
            },
            quantity: 1,
          },
        ],
        customer_email: created.email,
        client_reference_id: created.id,
        metadata: { bookingId: created.id, classId: created.classId },
        payment_intent_data: { metadata: { bookingId: created.id, classId: created.classId } },
        success_url: `${env.APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.APP_URL}/booking/cancelled?booking=${created.id}`,
        expires_at: Math.floor((created.seatReservationExpiresAt ?? new Date(Date.now() + 31 * 60 * 1000)).getTime() / 1000),
      },
      { idempotencyKey: `checkout:${created.id}` },
    );
    const [updated] = await db.update(bookings).set({ stripeCheckoutSessionId: stripeSession.id, updatedAt: new Date() }).where(eq(bookings.id, created.id)).returning();
    await db.update(payments).set({ stripeCheckoutSessionId: stripeSession.id, updatedAt: new Date() }).where(eq(payments.bookingId, created.id));
    if (!stripeSession.url || !updated) throw new Error("Payment provider did not return a checkout destination.");
    return { booking: updated, checkoutUrl: stripeSession.url, reused: false };
  } catch (error) {
    // If Stripe accepted the request but the local write failed, keep the reservation
    // recoverable. A retry uses the same Stripe idempotency key and the webhook can
    // still confirm the booking without creating a second payment.
    if (stripeSession) {
      try {
        const [recovered] = await db.update(bookings).set({ stripeCheckoutSessionId: stripeSession.id, updatedAt: new Date() }).where(eq(bookings.id, created.id)).returning();
        await db.update(payments).set({ stripeCheckoutSessionId: stripeSession.id, updatedAt: new Date() }).where(eq(payments.bookingId, created.id));
        if (recovered && stripeSession.url) return { booking: recovered, checkoutUrl: stripeSession.url, reused: true };
      } catch {
        // Leave the pending booking in place. The next attempt or a Stripe event
        // can reconcile it; do not claim that the payment failed.
      }
    }
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : undefined;
    const definitelyRejected = statusCode === 400 || statusCode === 401 || statusCode === 404 || statusCode === 422;
    if (definitelyRejected) {
      await db.transaction(async (tx) => {
        const [booking] = await tx.select().from(bookings).where(eq(bookings.id, created.id)).for("update").limit(1);
        if (booking && ["PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(booking.status)) {
          assertBookingTransition(booking.status, "PAYMENT_FAILED");
          await tx.update(bookings).set({ status: "PAYMENT_FAILED", seatReservationExpiresAt: null, updatedAt: new Date() }).where(eq(bookings.id, booking.id));
          await tx.update(payments).set({ status: "FAILED", updatedAt: new Date() }).where(eq(payments.bookingId, booking.id));
          await refreshCapacityStatus(tx, booking.classId, new Date());
        }
      });
    }
    if (error instanceof Error && /invalid country|no longer|closed|sold out/i.test(error.message)) throw error;
    if (!definitelyRejected) throw new Error("We couldn't confirm the payment session state. No completed payment has been confirmed by our server. Retry this same booking once, or contact support before starting another booking.");
    throw new Error("We couldn't start the payment session. No payment was confirmed. Please try again.");
  }
}

export async function markCheckoutCompleted(input: { session: import("stripe").default.Checkout.Session; paymentSucceeded: boolean }) {
  const session = input.session;
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) throw new Error("Stripe Checkout Session is missing a booking reference.");
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update").limit(1);
    if (!booking) throw new Error("Booking referenced by Stripe was not found.");
    const [payment] = await tx.select().from(payments).where(eq(payments.bookingId, booking.id)).for("update").limit(1);
    if (!payment) throw new Error("Payment record referenced by Stripe was not found.");
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    if (!input.paymentSucceeded) {
      if (booking.status === "PENDING_PAYMENT") assertBookingTransition(booking.status, "PAYMENT_PROCESSING");
      if (["PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(booking.status)) await tx.update(bookings).set({ status: "PAYMENT_PROCESSING", stripePaymentIntentId: paymentIntentId, updatedAt: new Date() }).where(eq(bookings.id, booking.id));
      await tx.update(payments).set({ status: "PROCESSING", stripePaymentIntentId: paymentIntentId, updatedAt: new Date() }).where(eq(payments.id, payment.id));
      return { booking, confirmed: false };
    }
    if (session.amount_total !== payment.amountTotal || session.currency?.toUpperCase() !== payment.currency) throw new Error("Stripe payment amount or currency does not match the booking snapshot.");
    if (["CONFIRMED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(booking.status)) return { booking, confirmed: true };
    const now = new Date();
    const [classRecord] = await tx.select({ status: classes.status }).from(classes).where(eq(classes.id, booking.classId)).limit(1);
    const classWasCancelled = classRecord?.status === "CANCELLED";
    if (booking.status === "CANCELLED" || classWasCancelled) {
      if (booking.status !== "CANCELLED") assertBookingTransition(booking.status, "CANCELLED");
      const [cancelledBooking] = booking.status === "CANCELLED"
        ? [booking]
        : await tx.update(bookings).set({ status: "CANCELLED", cancelledAt: booking.cancelledAt ?? now, seatReservationExpiresAt: null, updatedAt: now }).where(eq(bookings.id, booking.id)).returning();
      await tx.update(payments).set({ status: "SUCCEEDED", amountCaptured: session.amount_total ?? payment.amountTotal, stripePaymentIntentId: paymentIntentId, updatedAt: now }).where(eq(payments.id, payment.id));
      return { booking: cancelledBooking ?? booking, confirmed: false };
    }
    assertBookingTransition(booking.status, "CONFIRMED");
    const [updatedBooking] = await tx.update(bookings).set({ status: "CONFIRMED", stripePaymentIntentId: paymentIntentId, confirmedAt: booking.confirmedAt ?? now, paidAt: booking.paidAt ?? now, seatReservationExpiresAt: null, updatedAt: now }).where(eq(bookings.id, booking.id)).returning();
    await tx.update(payments).set({ status: payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED" ? payment.status : "SUCCEEDED", amountCaptured: session.amount_total ?? payment.amountTotal, stripePaymentIntentId: paymentIntentId, updatedAt: now }).where(eq(payments.id, payment.id));
    await refreshCapacityStatus(tx, booking.classId, now);
    return { booking: updatedBooking ?? booking, confirmed: true };
  });

  if (result.confirmed && result.booking) await enqueueBookingFulfilmentEmails(result.booking);
  return result;
}

export async function markCheckoutExpired(session: import("stripe").default.Checkout.Session) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) return;
  const db = getDb();
  const updated = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update").limit(1);
    if (!booking || !["PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(booking.status)) return null;
    assertBookingTransition(booking.status, "EXPIRED");
    const now = new Date();
    const [expired] = await tx.update(bookings).set({ status: "EXPIRED", expiredAt: now, seatReservationExpiresAt: null, updatedAt: now }).where(eq(bookings.id, booking.id)).returning();
    await tx.update(payments).set({ status: "FAILED", updatedAt: now }).where(eq(payments.bookingId, booking.id));
    await refreshCapacityStatus(tx, booking.classId, now);
    return expired;
  });
  return updated;
}

export async function markCheckoutPaymentFailed(session: import("stripe").default.Checkout.Session) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) return;
  const db = getDb();
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update").limit(1);
    if (!booking || !["PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(booking.status)) return booking ?? null;
    assertBookingTransition(booking.status, "PAYMENT_FAILED");
    const now = new Date();
    const [updated] = await tx.update(bookings).set({ status: "PAYMENT_FAILED", seatReservationExpiresAt: null, updatedAt: now }).where(eq(bookings.id, booking.id)).returning();
    await tx.update(payments).set({ status: "FAILED", updatedAt: now }).where(eq(payments.bookingId, booking.id));
    await refreshCapacityStatus(tx, booking.classId, now);
    return updated ?? booking;
  });
}

async function enqueueBookingFulfilmentEmails(booking: typeof bookings.$inferSelect): Promise<void> {
  const env = getServerEnv();
  const reference = makePublicBookingReference(booking.id);
  const confirmationDedupeKey = `booking-confirmation:${reference}`;
  const [existingConfirmation] = await getDb().select({ id: emailOutbox.id }).from(emailOutbox).where(eq(emailOutbox.dedupeKey, confirmationDedupeKey)).limit(1);
  if (!existingConfirmation) {
    const guestAccessToken = booking.userId ? undefined : await createAccountToken({ email: booking.email, purpose: "GUEST_BOOKING_ACCESS", bookingId: booking.id, expiresInMs: 30 * 24 * 60 * 60 * 1000 });
    await queueEmail({
      type: "BOOKING_CONFIRMATION",
      email: booking.email,
      name: booking.fullName,
      bookingReference: reference,
      classTitle: booking.classTitleSnapshot,
      classDate: formatDateTime(booking.confirmedAt ?? new Date(), booking.timezoneSnapshot),
      detailUrl: guestAccessToken ? `${env.APP_URL}/booking/confirmation?token=${encodeURIComponent(guestAccessToken)}` : `${env.APP_URL}/account/bookings/${booking.id}`,
      amount: formatMoney(booking.amountSnapshot, booking.currencySnapshot),
    }, confirmationDedupeKey);
  }
  if (booking.createAccountRequested) {
    const dedupeKey = `account-setup:${booking.id}`;
    const [existingMessage] = await getDb().select({ id: emailOutbox.id }).from(emailOutbox).where(eq(emailOutbox.dedupeKey, dedupeKey)).limit(1);
    if (!existingMessage) {
      const rawToken = await createAccountToken({ email: booking.email, purpose: "ACCOUNT_SETUP", bookingId: booking.id });
      await queueEmail({ type: "ACCOUNT_SETUP", email: booking.email, name: booking.fullName, url: `${env.APP_URL}/account/setup?token=${encodeURIComponent(rawToken)}` }, dedupeKey);
    }
  }
}

export async function cancelPendingBooking(userId: string, bookingId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId))).for("update").limit(1);
    if (!booking) throw new Error("Booking not found.");
    if (!["PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(booking.status)) throw new Error("Only an unpaid booking can be cancelled here.");
    assertBookingTransition(booking.status, "CANCELLED");
    const [updated] = await tx.update(bookings).set({ status: "CANCELLED", cancelledAt: new Date(), seatReservationExpiresAt: null, updatedAt: new Date() }).where(eq(bookings.id, booking.id)).returning();
    await tx.update(payments).set({ status: "FAILED", updatedAt: new Date() }).where(eq(payments.bookingId, booking.id));
    await refreshCapacityStatus(tx, booking.classId, new Date());
    return updated ?? booking;
  });
}

export async function cancelBookingByAdmin(bookingId: string) {
  const db = getDb();
  const updated = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update").limit(1);
    if (!booking) throw new Error("Booking not found.");
    if (["CANCELLED", "REFUNDED"].includes(booking.status)) throw new Error("This booking is already closed.");
    assertBookingTransition(booking.status, "CANCELLED");
    const now = new Date();
    const [updated] = await tx.update(bookings).set({ status: "CANCELLED", cancelledAt: now, seatReservationExpiresAt: null, updatedAt: now }).where(eq(bookings.id, bookingId)).returning();
    if (["PENDING", "PROCESSING"].includes((await tx.select({ status: payments.status }).from(payments).where(eq(payments.bookingId, bookingId)).for("update").limit(1))[0]?.status ?? "")) await tx.update(payments).set({ status: "FAILED", updatedAt: now }).where(eq(payments.bookingId, bookingId));
    await refreshCapacityStatus(tx, booking.classId, now);
    return updated ?? booking;
  });
  try {
    const [classRecord] = await db.select({ slug: classes.slug }).from(classes).where(eq(classes.id, updated.classId)).limit(1);
    const env = getServerEnv();
    await queueEmail({
      type: "BOOKING_CANCELLED",
      email: updated.email,
      name: updated.fullName,
      bookingReference: makePublicBookingReference(updated.id),
      classTitle: updated.classTitleSnapshot,
      reason: "If a payment was captured, any refund is handled as a separate operational action.",
      detailUrl: updated.userId ? `${env.APP_URL}/account/bookings/${updated.id}` : `${env.APP_URL}/classes/${classRecord?.slug ?? "classes"}`,
    }, `booking-cancelled:${updated.id}`);
  } catch (error) {
    console.error("[booking-cancellation-email]", { bookingId: updated.id, errorCategory: error instanceof Error ? error.name : "unknown" });
  }
  return updated;
}

export async function getBookingCapacityState(classId: string) {
  const [classRecord] = await getDb().select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (!classRecord) return null;
  const seats = await activeSeatCount(getDb(), classId);
  return { capacity: classRecord.unlimitedCapacity ? null : classRecord.seatCapacity, activeReservations: seats, remaining: classRecord.unlimitedCapacity ? null : Math.max((classRecord.seatCapacity ?? 0) - seats, 0) };
}
