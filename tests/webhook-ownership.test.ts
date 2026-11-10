import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { ownsStripeEvent } from "@/server/payments/webhook-ownership";

function event(type: string, object: Record<string, unknown>) {
  return { id: "evt_test", type, data: { object } } as unknown as Stripe.Event;
}

describe("shared-account Stripe webhook ownership", () => {
  it("accepts explicitly tagged academy events even before local Stripe references are saved", async () => {
    const lookup = vi.fn();
    expect(await ownsStripeEvent(event("checkout.session.completed", { id: "cs_own", metadata: { integration_type: "anzcpdweb" } }), lookup)).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each(["event_booking", "schedule_booking", "other"])("ignores explicit %s events without touching the database", async integration => {
    const lookup = vi.fn();
    expect(await ownsStripeEvent(event("checkout.session.completed", { id: "cs_other", metadata: { integration_type: integration } }), lookup)).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"])("requires a local match for legacy %s", async type => {
    const lookup = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const legacy = event(type, { id: "cs_old", metadata: { bookingId: "local-booking" } });
    expect(await ownsStripeEvent(legacy, lookup)).toBe(false);
    expect(await ownsStripeEvent(legacy, lookup)).toBe(true);
    expect(lookup).toHaveBeenCalledWith({ checkoutId: "cs_old", bookingId: "local-booking" });
  });

  it("supports legacy client references", async () => {
    const lookup = vi.fn().mockResolvedValue(true);
    await ownsStripeEvent(event("checkout.session.completed", { id: "cs_old", client_reference_id: "booking" }), lookup);
    expect(lookup).toHaveBeenCalledWith({ checkoutId: "cs_old", bookingId: "booking" });
  });

  it.each(["refund.created", "refund.updated", "refund.failed"])("matches %s against local refunds or payments, including dashboard refunds", async type => {
    const lookup = vi.fn().mockResolvedValue(false);
    expect(await ownsStripeEvent(event(type, { id: "re_other", payment_intent: { id: "pi_other" } }), lookup)).toBe(false);
    expect(lookup).toHaveBeenCalledWith({ refundId: "re_other", paymentIntentId: "pi_other", localRefundId: undefined });
    lookup.mockResolvedValue(true);
    expect(await ownsStripeEvent(event(type, { id: "re_own", payment_intent: "pi_own", metadata: { localRefundId: "refund" } }), lookup)).toBe(true);
  });

  it("only lists charge refunds after identifying a local payment", async () => {
    const lookup = vi.fn().mockResolvedValue(false);
    expect(await ownsStripeEvent(event("charge.refunded", { id: "ch_other", payment_intent: "pi_other" }), lookup)).toBe(false);
    expect(lookup).toHaveBeenCalledWith({ paymentIntentId: "pi_other" });
  });

  it("matches failed intents by their own ID", async () => {
    const lookup = vi.fn().mockResolvedValue(true);
    expect(await ownsStripeEvent(event("payment_intent.payment_failed", { id: "pi_own" }), lookup)).toBe(true);
    expect(lookup).toHaveBeenCalledWith({ paymentIntentId: "pi_own" });
  });

  it("ignores unsupported events even with academy metadata", async () => {
    const lookup = vi.fn();
    expect(await ownsStripeEvent(event("customer.created", { id: "cus_own", metadata: { integration_type: "anzcpdweb" } }), lookup)).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });
});
