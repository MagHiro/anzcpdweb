import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Turnstile verification", () => {
  beforeEach(() => {
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.DATABASE_URL = "postgresql://localhost/anzcpd";
    process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth";
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    process.env.TURNSTILE_DEV_BYPASS = "false";
  });

  it("rejects a missing token before calling Cloudflare", async () => {
    const { verifyTurnstile } = await import("@/server/security/turnstile");
    const result = await verifyTurnstile({ token: undefined });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected Turnstile rejection");
    expect(result.code).toBe("missing-input-response");
  });

  it("accepts a valid Siteverify response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 })));
    const { verifyTurnstile } = await import("@/server/security/turnstile");
    expect(await verifyTurnstile({ token: "valid-token", remoteIp: "127.0.0.1" })).toEqual({ ok: true });
  });

  it("turns duplicate or expired tokens into a human message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, "error-codes": ["timeout-or-duplicate"] }), { status: 200 })));
    const { verifyTurnstile } = await import("@/server/security/turnstile");
    const result = await verifyTurnstile({ token: "expired-token" });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected Turnstile rejection");
    expect(result.message).toContain("expired");
  });
});
