import { describe, expect, it, vi } from "vitest";
import { isPublicAuthEndpoint } from "@/lib/security/auth-endpoints";
import { getClientIp } from "@/lib/utils";

vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ APP_URL: "https://example.com" }) }));
import { isSameOrigin } from "@/lib/security/origin";

describe("auth security boundaries", () => {
  it("does not expose raw auth endpoints that bypass validation, CAPTCHA or session revocation", () => {
    for (const path of ["sign-in/email", "sign-up/email", "request-password-reset", "change-password", "update-user", "send-verification-email", "reset-password"]) {
      expect(isPublicAuthEndpoint("POST", `/api/auth/${path}`)).toBe(false);
    }
    expect(isPublicAuthEndpoint("POST", "/api/auth/sign-out")).toBe(true);
    expect(isPublicAuthEndpoint("GET", "/api/auth/verify-email")).toBe(true);
    expect(isPublicAuthEndpoint("GET", "/api/auth/reset-password/valid-token")).toBe(true);
    expect(isPublicAuthEndpoint("GET", "/api/auth/sign-out")).toBe(false);
  });

  it("rejects absent, malformed, foreign and explicitly cross-site origins", () => {
    for (const headers of [{}, { origin: "null" }, { origin: "https://evil.example" }, { origin: "https://example.com", "sec-fetch-site": "cross-site" }] as Record<string, string>[]) {
      expect(isSameOrigin(new Request("https://example.com/api/auth/login", { headers }))).toBe(false);
    }
    expect(isSameOrigin(new Request("https://example.com/api/auth/login", { headers: { origin: "https://example.com" } }))).toBe(true);
  });

  it("ignores untrusted Cloudflare and leftmost forwarded headers", () => {
    expect(getClientIp(new Headers({ "cf-connecting-ip": "spoof", "x-forwarded-for": "spoof, 192.0.2.1" }))).toBe("192.0.2.1");
    expect(getClientIp(new Headers({ "x-real-ip": "spoof", "x-forwarded-for": "spoof, 192.0.2.2" }))).toBe("192.0.2.2");
  });
});
