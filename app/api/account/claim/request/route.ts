import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { user } from "@/db/schema";
import { createAccountToken } from "@/server/auth/tokens";
import { queueEmail } from "@/server/email/service";
import { getClientIp } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in before requesting a claim link." }, { status: 401 });
  if (!(await consumeRateLimit({ key: `account-claim-request:${getClientIp(request.headers)}:${session.user.id}`, limit: 3, windowMs: 15 * 60 * 1000 }))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const [accountUser] = await getDb().select({ email: user.email, name: user.name, emailVerified: user.emailVerified }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!accountUser?.emailVerified) return NextResponse.json({ error: "Verify your account email before requesting a claim link." }, { status: 403 });
  try {
    const rawToken = await createAccountToken({ email: accountUser.email, purpose: "ACCOUNT_CLAIM" });
    const env = getServerEnv();
    await queueEmail({ type: "ACCOUNT_CLAIM", email: accountUser.email, name: accountUser.name, url: `${env.APP_URL}/account/claim?token=${encodeURIComponent(rawToken)}` }, `account-claim:${rawToken}`);
    return NextResponse.json({ ok: true, message: "If previous guest bookings are available for this verified email, we’ve sent a secure claim link." });
  } catch {
    return NextResponse.json({ error: "We could not send the claim link. Your existing bookings remain unchanged; try again later." }, { status: 503 });
  }
}
