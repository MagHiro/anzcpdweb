import Stripe from "stripe";
import { and, eq, inArray, sql } from "drizzle-orm";
import { bookings, payments, refunds } from "@/db/schema";
import { getDb } from "@/lib/db";
import { formatMoney, makePublicBookingReference } from "@/lib/utils";
import { getServerEnv } from "@/lib/env";
import { getStripe } from "@/server/payments/stripe";
import { queueEmail } from "@/server/email/service";
import { assertBookingTransition } from "@/server/bookings/transitions";

function mapRefundStatus(status: string | null): "PENDING" | "SUCCEEDED" | "FAILED" | "REQUIRES_ACTION" | "CANCELLED" {
  if (status === "succeeded") return "SUCCEEDED";
  if (status === "failed") return "FAILED";
  if (status === "canceled") return "CANCELLED";
  if (status === "requires_action") return "REQUIRES_ACTION";
  return "PENDING";
}

async function refundableAmount(paymentId: string, tx = getDb()): Promise<number> {
  const [payment] = await tx.select({ captured: payments.amountCaptured, refunded: payments.amountRefunded }).from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!payment) return 0;
  const [pending] = await tx.select({ amount: sql<number>`coalesce(sum(${refunds.amount}), 0)::int` }).from(refunds).where(and(eq(refunds.paymentId, paymentId), inArray(refunds.status, ["PENDING", "REQUIRES_ACTION", "SUCCEEDED"] as const)));
  return Math.max(payment.captured - payment.refunded - Number(pending?.amount ?? 0), 0);
}

export async function createAdminRefund(input: { bookingId: string; amount: number; reason: string; internalNote?: string; idempotencyKey: string; adminUserId: string }) {
  const db = getDb();
  const existing = await db.select().from(refunds).where(eq(refunds.requestIdempotencyKey, input.idempotencyKey)).limit(1);
  if (existing[0]) return existing[0];
  const pending = await db.transaction(async (tx) => {
    const [row] = await tx.select({ booking: bookings, payment: payments }).from(bookings).innerJoin(payments, eq(bookings.id, payments.bookingId)).where(eq(bookings.id, input.bookingId)).for("update").limit(1);
    if (!row) throw new Error("Paid booking not found.");
    if (!["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(row.payment.status)) throw new Error("This booking does not have a captured payment available for refund.");
    if (!row.payment.stripePaymentIntentId) throw new Error("This payment has no refundable Stripe payment reference.");
    const available = await refundableAmount(row.payment.id, tx);
    if (input.amount > available) throw new Error(`The maximum refundable amount is ${formatMoney(available, row.payment.currency)}.`);
    const [created] = await tx.insert(refunds).values({ bookingId: row.booking.id, paymentId: row.payment.id, amount: input.amount, currency: row.payment.currency, reason: input.reason, internalNote: input.internalNote || null, initiatedBy: input.adminUserId, requestIdempotencyKey: input.idempotencyKey, status: "PENDING" }).returning();
    if (!created) throw new Error("Could not create the refund request.");
    return { refund: created, paymentIntentId: row.payment.stripePaymentIntentId };
  });

  let stripeRefund: Stripe.Refund;
  try {
    stripeRefund = await getStripe().refunds.create({ payment_intent: pending.paymentIntentId, amount: pending.refund.amount, reason: "requested_by_customer", metadata: { bookingId: pending.refund.bookingId, localRefundId: pending.refund.id } }, { idempotencyKey: `refund:${input.idempotencyKey}` });
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : undefined;
    const definitelyRejected = [400, 401, 402, 404, 409, 422].includes(statusCode ?? -1);
    if (definitelyRejected) {
      await db.update(refunds).set({ status: "FAILED", failureMessage: error instanceof Error ? error.message.slice(0, 500) : "Refund request rejected", updatedAt: new Date() }).where(eq(refunds.id, pending.refund.id));
      throw new Error("The refund request was rejected. No refund has been confirmed; review the payment details before trying again.");
    }
    throw new Error("We couldn't confirm the refund request state. Do not submit another refund; wait for Stripe to report the result or ask an administrator to reconcile it.");
  }
  try {
    const [updated] = await db.update(refunds).set({ stripeRefundId: stripeRefund.id, status: mapRefundStatus(stripeRefund.status), updatedAt: new Date() }).where(eq(refunds.id, pending.refund.id)).returning();
    if (updated && stripeRefund.status === "succeeded") await syncPaymentRefundTotals(updated.bookingId);
    return updated ?? pending.refund;
  } catch {
    throw new Error("Stripe accepted the refund request, but the local state is still being synchronized. Do not submit another refund; wait for the Stripe webhook.");
  }
}

export async function syncRefundFromStripe(stripeRefund: Stripe.Refund) {
  const db = getDb();
  const bookingId = typeof stripeRefund.metadata?.bookingId === "string" ? stripeRefund.metadata.bookingId : undefined;
  let local = stripeRefund.id ? (await db.select().from(refunds).where(eq(refunds.stripeRefundId, stripeRefund.id)).limit(1))[0] : undefined;
  if (!local && bookingId) {
    local = (await db.select().from(refunds).where(and(eq(refunds.bookingId, bookingId), eq(refunds.amount, stripeRefund.amount))).orderBy(refunds.createdAt).limit(1))[0];
  }
  if (!local) {
    const paymentIntentId = typeof stripeRefund.payment_intent === "string" ? stripeRefund.payment_intent : stripeRefund.payment_intent?.id;
    if (paymentIntentId) {
      const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntentId)).limit(1);
      if (payment) {
        local = (await db.insert(refunds).values({ bookingId: payment.bookingId, paymentId: payment.id, stripeRefundId: stripeRefund.id, amount: stripeRefund.amount, currency: stripeRefund.currency.toUpperCase(), status: mapRefundStatus(stripeRefund.status), reason: stripeRefund.reason ?? "Stripe refund", requestIdempotencyKey: `stripe-event:${stripeRefund.id}` }).onConflictDoNothing({ target: refunds.stripeRefundId }).returning())[0];
      }
    }
  }
  if (!local) return null;
  const [updated] = await db.update(refunds).set({ stripeRefundId: stripeRefund.id, status: mapRefundStatus(stripeRefund.status), failureMessage: stripeRefund.failure_reason ?? null, updatedAt: new Date() }).where(eq(refunds.id, local.id)).returning();
  if (updated) await syncPaymentRefundTotals(updated.bookingId);
  return updated ?? local;
}

export async function syncPaymentRefundTotals(bookingId: string) {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update").limit(1);
    if (!booking) return null;
    const [payment] = await tx.select().from(payments).where(eq(payments.bookingId, bookingId)).for("update").limit(1);
    if (!payment) return null;
    const [totals] = await tx.select({ refunded: sql<number>`coalesce(sum(${refunds.amount}) filter (where ${refunds.status} = 'SUCCEEDED'), 0)::int` }).from(refunds).where(eq(refunds.paymentId, payment.id));
    const refundedAmount = Number(totals?.refunded ?? 0);
    const nextPaymentStatus = refundedAmount >= payment.amountCaptured ? "REFUNDED" : refundedAmount > 0 ? "PARTIALLY_REFUNDED" : payment.status;
    const nextBookingStatus = refundedAmount >= payment.amountCaptured ? "REFUNDED" : refundedAmount > 0 ? "PARTIALLY_REFUNDED" : booking.status;
    await tx.update(payments).set({ amountRefunded: refundedAmount, status: nextPaymentStatus, updatedAt: new Date() }).where(eq(payments.id, payment.id));
    if (nextBookingStatus !== booking.status) {
      assertBookingTransition(booking.status, nextBookingStatus);
      await tx.update(bookings).set({ status: nextBookingStatus, updatedAt: new Date() }).where(eq(bookings.id, booking.id));
    }
    const [current] = await tx.select().from(refunds).where(eq(refunds.bookingId, bookingId)).orderBy(sql`${refunds.createdAt} desc`).limit(1);
    return { booking, current };
  });
  if (!result?.current) return;
  const env = getServerEnv();
  await queueEmail({ type: "REFUND_STATUS", email: result.booking.email, name: result.booking.fullName, bookingReference: makePublicBookingReference(result.booking.id), amount: formatMoney(result.current.amount, result.current.currency), status: result.current.status.toLowerCase(), detailUrl: result.booking.userId ? `${env.APP_URL}/account/bookings/${result.booking.id}` : `${env.APP_URL}/account/claim` });
}
