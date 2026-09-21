import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { claimBookingsSchema } from "@/lib/validation";
import { consumeAccountToken, linkVerifiedEmailBookings } from "@/server/auth/tokens";
import { isSameOrigin } from "@/lib/security/origin";
import { getClientIp } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in before connecting booking records." }, { status: 401 });
  if (!(await consumeRateLimit({ key: `account-claim:${getClientIp(request.headers)}:${session.user.id}`, limit: 8, windowMs: 15 * 60 * 1000 }))) return NextResponse.json({ error: "Too many claim attempts. Please try again later." }, { status: 429 });
  const parsed = claimBookingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "This claim link is invalid." }, { status: 400 });
  const consumed = await consumeAccountToken(parsed.data.token, "ACCOUNT_CLAIM", session.user.email);
  if (!consumed) return NextResponse.json({ error: "This claim link is invalid, expired, or belongs to another email address." }, { status: 403 });
  const linked = await linkVerifiedEmailBookings(session.user.email, session.user.id);
  return NextResponse.json({ ok: true, linked });
}
