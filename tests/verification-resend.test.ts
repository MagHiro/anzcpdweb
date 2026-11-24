import { afterEach, expect, it, vi } from "vitest";
import { createVerificationResendProof, getVerificationResendEmail } from "@/server/auth/verification-resend";

vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ BETTER_AUTH_SECRET: "test-secret-for-verification-resend" }) }));
afterEach(() => vi.useRealTimers());

it("accepts only unexpired signed proofs and uses the address in the proof", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-24T00:00:00Z"));
  const email = "first@example.com";
  const proof = createVerificationResendProof(email);
  const [, signature] = proof.split(".");
  const tampered = Buffer.from(JSON.stringify(["other@example.com", Date.now() + 600_000])).toString("base64url");

  expect(getVerificationResendEmail({ proof, email: "other@example.com" })).toBe(email);
  expect(getVerificationResendEmail({ proof: `${tampered}.${signature}` })).toBeNull();
  expect(getVerificationResendEmail({ email })).toBeNull();
  vi.advanceTimersByTime(600_000);
  expect(getVerificationResendEmail({ proof })).toBeNull();
});
