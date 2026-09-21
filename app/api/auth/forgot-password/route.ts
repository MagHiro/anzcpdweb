import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { verifyTurnstile } from "@/server/security/turnstile";
import { auth } from "@/server/auth/auth";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const ip = getClientIp(request.headers);
  if (!(await consumeRateLimit({ key: `forgot-password:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 }))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip });
  if (!verification.ok) return NextResponse.json({ error: verification.message }, { status: 400 });
  try {
    await auth.api.requestPasswordReset({ body: { email: parsed.data.email, redirectTo: "/reset-password" }, headers: request.headers });
  } catch {
    // Deliberately return the same response for unknown and known addresses.
  }
  return NextResponse.json({ ok: true, message: "If an account exists for that email, we’ve sent reset instructions." });
}
