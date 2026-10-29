import { eq } from "drizzle-orm";
import { bookings } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getStripe } from "@/server/payments/stripe";
import { markCheckoutCompleted, markCheckoutExpired, markCheckoutPaymentFailed } from "@/server/bookings/service";
import { syncRefundFromStripe } from "@/server/payments/refunds";
import { writeAuditLog } from "@/server/audit";

/** Read provider state; never creates a charge, refund, or new Checkout session. */
export async function reconcileBookingPayment(bookingId: string, adminUserId: string) {
  const [booking] = await getDb().select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking?.stripeCheckoutSessionId) throw new Error("This booking has no Stripe Checkout reference to reconcile.");
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(booking.stripeCheckoutSessionId);
  if (session.metadata?.bookingId !== booking.id && session.client_reference_id !== booking.id) throw new Error("Stripe Checkout booking reference does not match.");
  if (session.status === "complete") {
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") await markCheckoutCompleted({ session, paymentSucceeded: true });
    else {
      const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      const intent = intentId ? await stripe.paymentIntents.retrieve(intentId) : null;
      if (intent?.status === "canceled") await markCheckoutPaymentFailed(session);
      else await markCheckoutCompleted({ session, paymentSucceeded: false });
    }
  } else if (session.status === "expired") await markCheckoutExpired(session);
  const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (intentId) for await (const refund of stripe.refunds.list({ payment_intent: intentId, limit: 100 })) await syncRefundFromStripe(refund);
  await writeAuditLog({ actorUserId: adminUserId, action: "PAYMENT_RECONCILED", entityType: "booking", entityId: booking.id, metadata: { stripeCheckoutSessionId: session.id, checkoutStatus: session.status, paymentStatus: session.payment_status } });
  return { checkoutStatus: session.status, paymentStatus: session.payment_status };
}
