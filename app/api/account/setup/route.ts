import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { getDb } from "@/lib/db";
import { accountClaimTokens, user } from "@/db/schema";
import { accountSetupSchema } from "@/lib/validation";
import { completeAccountLink, hashToken } from "@/server/auth/tokens";
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
  if (!tokenRecord || tokenRecord.purpose !== "ACCOUNT_SETUP" || tokenRecord.expiresAt <= new Date()) return NextResponse.json({ error: "This account setup link has expired. Request a new recovery link or contact support." }, { status: 400 });
  const [existing] = await getDb().select({ id: user.id }).from(user).where(eq(user.email, tokenRecord.email)).limit(1);
  try {
    let userId = existing?.id;
    if (existing) {
      // Sign-up may have committed before a previous attempt failed. Prove the
      // submitted password without requiring email verification first.
      const { verifyPassword } = await import("better-auth/crypto");
      const { account } = await import("@/db/schema");
      const { and } = await import("drizzle-orm");
      const [credential] = await getDb().select({ password: account.password }).from(account).where(and(eq(account.userId, existing.id), eq(account.providerId, "credential"))).limit(1);
      if (!credential?.password || !await verifyPassword({ hash: credential.password, password: parsed.data.password })) return NextResponse.json({ error: "An account already exists. Use its current password to recover setup, or reset your password and sign in." }, { status: 409 });
    } else {
      const result = await auth.api.signUpEmail({ body: { name: parsed.data.name, email: tokenRecord.email, password: parsed.data.password }, headers: request.headers });
      userId = result.user.id;
    }
    if (!userId || !await completeAccountLink(parsed.data.token, "ACCOUNT_SETUP", tokenRecord.email, userId)) throw new Error("Account setup proof could not be applied.");
    return NextResponse.json({ ok: true, message: "Your account is ready. You can now sign in and manage your booking." });
  } catch {
    return NextResponse.json({ error: "We could not set up the account. Your booking remains unchanged; please try again or contact support." }, { status: 400 });
  }
}
