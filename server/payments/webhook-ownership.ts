import type Stripe from "stripe";
import { eq, or } from "drizzle-orm";
import { bookings, payments, refunds } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { stripeIntegrationMetadata } from "@/server/payments/integration";

type References = { checkoutId?: string; bookingId?: string; paymentIntentId?: string; refundId?: string; localRefundId?: string };

async function hasLocalReference(refs: References): Promise<boolean> {
  const db = getDb();
  const bookingId = uuidSchema.safeParse(refs.bookingId);
  if (refs.checkoutId || bookingId.success) {
    const [booking] = await db.select({ id: bookings.id }).from(bookings).where(or(
      refs.checkoutId ? eq(bookings.stripeCheckoutSessionId, refs.checkoutId) : undefined,
      bookingId.success ? eq(bookings.id, bookingId.data) : undefined,
    )).limit(1);
    if (booking) return true;
  }
  if (refs.paymentIntentId) {
    const [payment] = await db.select({ id: payments.id }).from(payments).where(eq(payments.stripePaymentIntentId, refs.paymentIntentId)).limit(1);
    if (payment) return true;
  }
  const localRefundId = uuidSchema.safeParse(refs.localRefundId);
  if (refs.refundId || localRefundId.success) {
    const [refund] = await db.select({ id: refunds.id }).from(refunds).where(or(
      refs.refundId ? eq(refunds.stripeRefundId, refs.refundId) : undefined,
      localRefundId.success ? eq(refunds.id, localRefundId.data) : undefined,
    )).limit(1);
    if (refund) return true;
  }
  return false;
}

/** Only call after signature verification. Untagged historical objects need a local match. */
export async function ownsStripeEvent(event: Stripe.Event, lookup: (refs: References) => Promise<boolean> = hasLocalReference): Promise<boolean> {
  const supported = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired", "payment_intent.payment_failed", "refund.created", "refund.updated", "refund.failed", "charge.refunded"];
  if (!supported.includes(event.type)) return false;
  const object = event.data.object as unknown as {
    id: string;
    metadata?: Record<string, string> | null;
    client_reference_id?: string | null;
    payment_intent?: string | { id: string } | null;
  };
  const integration = object.metadata?.integration_type;
  if (integration !== undefined) return integration === stripeIntegrationMetadata.integration_type;
  const paymentIntentId = typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id;
  if (event.type.startsWith("checkout.session.")) {
    return lookup({ checkoutId: object.id, bookingId: object.metadata?.bookingId ?? object.client_reference_id ?? undefined });
  }
  if (event.type.startsWith("refund.")) {
    return lookup({ refundId: object.id, localRefundId: object.metadata?.localRefundId, paymentIntentId });
  }
  return lookup({ paymentIntentId: event.type.startsWith("payment_intent.") ? object.id : paymentIntentId });
}
