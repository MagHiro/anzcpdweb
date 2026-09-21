import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerEnv, requireConfigured } from "@/lib/env";
import { getStripe } from "@/server/payments/stripe";
import { processStripeEvent } from "@/server/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const env = getServerEnv();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, requireConfigured(env.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET"));
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  try {
    await processStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed and will be retried." }, { status: 500 });
  }
}
