import { getServerEnv, isDevelopmentTurnstileBypassEnabled } from "@/lib/env";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export type TurnstileResult =
  | { ok: true }
  | { ok: false; message: string; code: string };

export async function verifyTurnstile(input: { token: string | undefined; remoteIp?: string }): Promise<TurnstileResult> {
  const env = getServerEnv();
  if (isDevelopmentTurnstileBypassEnabled()) return { ok: true };
  if (!input.token) return { ok: false, message: "Complete the security check before continuing.", code: "missing-input-response" };
  if (!env.TURNSTILE_SECRET_KEY) {
    if (env.NODE_ENV === "production") return { ok: false, message: "Security verification is temporarily unavailable.", code: "not-configured" };
    return { ok: false, message: "Security verification is not configured for this environment.", code: "not-configured" };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: input.token, remoteip: input.remoteIp }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, message: "Verification is temporarily unavailable. Please try again.", code: "upstream-error" };
    const result = (await response.json()) as TurnstileResponse;
    if (!result.success) {
      const code = result["error-codes"]?.[0] ?? "verification-failed";
      const message = code === "timeout-or-duplicate" ? "Verification expired. Please complete the security check again." : "We could not verify the security check. Please try again.";
      return { ok: false, message, code };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Verification is temporarily unavailable. Please try again.", code: "network-error" };
  }
}
