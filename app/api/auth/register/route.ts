import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { authRegistrationSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { verifyTurnstile } from "@/server/security/turnstile";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const parsed = authRegistrationSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Review the registration details.", fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])) }, { status: 400 });
  const ip = getClientIp(request.headers);
  if (!(await consumeRateLimit({ key: `registration:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 }))) return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip });
  if (!verification.ok) return NextResponse.json({ error: verification.message }, { status: 400 });
  try {
    return await auth.api.signUpEmail({ body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password }, headers: request.headers, asResponse: true });
  } catch {
    return NextResponse.json({ error: "Registration could not be completed. The email may already have an account; try signing in or resetting the password." }, { status: 400 });
  }
}
