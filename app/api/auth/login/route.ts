import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { authLoginSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { verifyTurnstile } from "@/server/security/turnstile";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const parsed = authLoginSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const ip = getClientIp(request.headers);
  if (!(await consumeRateLimit({ key: `login:${ip}:${parsed.data.email}`, limit: 10, windowMs: 15 * 60 * 1000 }))) return NextResponse.json({ error: "Too many sign-in attempts. Please try again later." }, { status: 429 });
  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip });
  if (!verification.ok) return NextResponse.json({ error: verification.message }, { status: 400 });
  try {
    return await auth.api.signInEmail({ body: { email: parsed.data.email, password: parsed.data.password }, headers: request.headers, asResponse: true });
  } catch {
    return NextResponse.json({ error: "Sign-in failed. Check your email and password, then try again." }, { status: 401 });
  }
}
