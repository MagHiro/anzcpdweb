import Stripe from "stripe";
import { and, eq, isNull, lt, ne, or } from "drizzle-orm";
import { webhookEvents } from "@/db/schema";
import { getDb } from "@/lib/db";
import { markCheckoutCompleted, markCheckoutExpired, markCheckoutPaymentFailed } from "@/server/bookings/service";
import { syncRefundFromStripe } from "@/server/payments/refunds";
import { shouldProcessWebhook } from "@/server/payments/webhook-policy";

export async function processStripeEvent(event: Stripe.Event): Promise<{ duplicate: boolean }> {
  const db = getDb();
  await db.insert(webhookEvents).values({ stripeEventId: event.id, type: event.type, payload: event.data.object as unknown as Record<string, unknown>, status: "RECEIVED" }).onConflictDoNothing({ target: webhookEvents.stripeEventId });
  const processingLeaseExpiredAt = new Date(Date.now() - 5 * 60 * 1000);
  const [claim] = await db.update(webhookEvents).set({ status: "PROCESSING", updatedAt: new Date() }).where(and(eq(webhookEvents.stripeEventId, event.id), isNull(webhookEvents.processedAt), or(ne(webhookEvents.status, "PROCESSING"), lt(webhookEvents.updatedAt, processingLeaseExpiredAt)))).returning({ id: webhookEvents.id });
  if (!claim) {
    const [existing] = await db.select({ processedAt: webhookEvents.processedAt }).from(webhookEvents).where(eq(webhookEvents.stripeEventId, event.id)).limit(1);
    if (!shouldProcessWebhook(existing ?? null)) return { duplicate: true };
    return { duplicate: true };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await markCheckoutCompleted({ session: event.data.object as Stripe.Checkout.Session, paymentSucceeded: (event.data.object as Stripe.Checkout.Session).payment_status === "paid" });
        break;
      case "checkout.session.async_payment_succeeded":
        await markCheckoutCompleted({ session: event.data.object as Stripe.Checkout.Session, paymentSucceeded: true });
        break;
      case "checkout.session.async_payment_failed":
        await markCheckoutPaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
        await markCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      case "refund.created":
      case "refund.updated":
      case "refund.failed":
        await syncRefundFromStripe(event.data.object as Stripe.Refund);
        break;
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (paymentIntentId) {
          const stripeRefunds = await (await import("@/server/payments/stripe")).getStripe().refunds.list({ charge: charge.id, limit: 100 });
          for (const refund of stripeRefunds.data) await syncRefundFromStripe(refund);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.bookingId;
        if (bookingId) {
          const session = { metadata: { bookingId }, client_reference_id: bookingId } as unknown as Stripe.Checkout.Session;
          await markCheckoutPaymentFailed(session);
        }
        break;
      }
      default:
        break;
    }
    await db.update(webhookEvents).set({ status: "PROCESSED", processedAt: new Date(), updatedAt: new Date(), errorMessage: null }).where(and(eq(webhookEvents.stripeEventId, event.id), isNull(webhookEvents.processedAt)));
    return { duplicate: false };
  } catch (error) {
    await db.update(webhookEvents).set({ status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook error", updatedAt: new Date() }).where(eq(webhookEvents.stripeEventId, event.id));
    throw error;
  }
}
