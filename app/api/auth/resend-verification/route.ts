import { auth } from "@/server/auth/auth";
import { isSameOrigin } from "@/lib/security/origin";
import { getClientIp } from "@/lib/utils";
import { getVerificationResendEmail } from "@/server/auth/verification-resend";
import { consumeRateLimit } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  const email = getVerificationResendEmail(await request.json().catch(() => null));
  if (!email) return Response.json({ error: "Sign in again to request a new verification email." }, { status: 400 });

  const ip = getClientIp(request.headers);
  if (!(await consumeRateLimit({ key: `verification-resend-ip:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 }))) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  if (!(await consumeRateLimit({ key: `verification-resend-email:${email}`, limit: 1, windowMs: 60 * 1000 }))) {
    return Response.json({ error: "Please wait a minute before requesting another email." }, { status: 429 });
  }

  try {
    // Don't pass any session cookies: the proof authorizes only its own email address.
    await auth.api.sendVerificationEmail({ body: { email, callbackURL: "/sign-in" } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "We couldn’t resend the verification email. Please try again later." }, { status: 503 });
  }
}
