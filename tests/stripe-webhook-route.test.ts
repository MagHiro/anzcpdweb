import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ constructEvent: vi.fn(), process: vi.fn() }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ STRIPE_WEBHOOK_SECRET: "test-secret" }), requireConfigured: (value: string) => value }));
vi.mock("@/server/payments/stripe", () => ({ getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }) }));
vi.mock("@/server/payments/webhook", () => ({ processStripeEvent: mocks.process }));
import { POST } from "@/app/api/stripe/webhook/route";

describe("Stripe webhook acknowledgements", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.constructEvent.mockReturnValue({ id: "evt_test" });
  });
  const request = () => new Request("https://example.com/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": "test" }, body: "{}" });

  it("acknowledges ignored events with HTTP 200", async () => {
    mocks.process.mockResolvedValue({ duplicate: false, ignored: true });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, handled: false, reason: "ignored" });
  });

  it("acknowledges owned events with HTTP 200", async () => {
    mocks.process.mockResolvedValue({ duplicate: false });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, handled: true });
  });

  it("preserves retries for genuine processing failures", async () => {
    mocks.process.mockRejectedValue(new Error("Database unavailable"));
    expect((await POST(request())).status).toBe(500);
  });

  it("rejects invalid signatures before checking ownership", async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error("Invalid signature"); });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.process).not.toHaveBeenCalled();
  });
});
