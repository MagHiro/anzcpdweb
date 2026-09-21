import { describe, expect, it } from "vitest";
import { shouldProcessWebhook } from "@/server/payments/webhook-policy";

describe("Stripe webhook idempotency policy", () => {
  it("processes a new or failed event and no-ops a processed event", () => {
    expect(shouldProcessWebhook(null)).toBe(true);
    expect(shouldProcessWebhook({ processedAt: null })).toBe(true);
    expect(shouldProcessWebhook({ processedAt: new Date() })).toBe(false);
  });
});
