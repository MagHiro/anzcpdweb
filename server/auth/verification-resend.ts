import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { emailSchema } from "@/lib/validation";

const lifetimeMs = 10 * 60 * 1000;
const resendProofSchema = z.tuple([emailSchema, z.number().int()]);
const resendVerificationRequestSchema = z.object({ proof: z.string().max(768).regex(/^[\w-]+\.[\w-]{43}$/) });

function signature(payload: string) {
  // A resend proof is not an email verification token or a session.
  return createHmac("sha256", getServerEnv().BETTER_AUTH_SECRET).update(`verification-resend:${payload}`).digest();
}

export function createVerificationResendProof(email: string) {
  const payload = Buffer.from(JSON.stringify([email, Date.now() + lifetimeMs])).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function getVerificationResendEmail(body: unknown) {
  const request = resendVerificationRequestSchema.safeParse(body);
  if (!request.success) return null;
  const [payload, supplied] = request.data.proof.split(".");
  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(signature(payload).toString("base64url")))) return null;

  const parsed = resendProofSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  return parsed.success && parsed.data[1] > Date.now() ? parsed.data[0] : null;
}
