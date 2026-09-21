import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { getDb } from "@/lib/db";
import { accountClaimTokens, user } from "@/db/schema";
import { accountSetupSchema } from "@/lib/validation";
import { consumeAccountToken, hashToken, linkVerifiedEmailBookings, markUserEmailVerified } from "@/server/auth/tokens";
import { isSameOrigin } from "@/lib/security/origin";
import { getClientIp } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  if (!(await consumeRateLimit({ key: `account-setup:${getClientIp(request.headers)}`, limit: 8, windowMs: 15 * 60 * 1000 }))) return NextResponse.json({ error: "Too many account setup attempts. Please try again later." }, { status: 429 });
  const parsed = accountSetupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the account setup details." }, { status: 400 });
  const [tokenRecord] = await getDb().select().from(accountClaimTokens).where(eq(accountClaimTokens.tokenHash, hashToken(parsed.data.token))).limit(1);
  if (!tokenRecord || tokenRecord.purpose !== "ACCOUNT_SETUP" || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) return NextResponse.json({ error: "This account setup link has expired or already been used." }, { status: 400 });
  const [existing] = await getDb().select({ id: user.id }).from(user).where(eq(user.email, tokenRecord.email)).limit(1);
  if (existing) return NextResponse.json({ error: "An account already exists for this email. Sign in, then use the booking claim link to connect it." }, { status: 409 });
  try {
    const result = await auth.api.signUpEmail({ body: { name: parsed.data.name, email: tokenRecord.email, password: parsed.data.password }, headers: request.headers });
    await markUserEmailVerified(result.user.id);
    await linkVerifiedEmailBookings(tokenRecord.email, result.user.id);
    await consumeAccountToken(parsed.data.token, "ACCOUNT_SETUP", tokenRecord.email);
    return NextResponse.json({ ok: true, message: "Your account is ready. You can now sign in and manage your booking." });
  } catch {
    return NextResponse.json({ error: "We could not set up the account. Your booking remains unchanged; please try again or contact support." }, { status: 400 });
  }
}
