import Stripe from "stripe";
import { getServerEnv, requireConfigured } from "@/lib/env";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const env = getServerEnv();
  stripeClient = new Stripe(requireConfigured(env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY"));
  return stripeClient;
}
