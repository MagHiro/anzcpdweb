import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { z } from "zod";
import { isSameOrigin } from "@/lib/security/origin";
import { consumeRateLimit } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(128) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!await consumeRateLimit({ key: `change-password:${session.user.id}`, limit: 5, windowMs: 15 * 60 * 1000 })) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a password with at least 12 characters." }, { status: 400 });
  try {
    return await auth.api.changePassword({ body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true }, headers: request.headers, asResponse: true });
  } catch { return NextResponse.json({ error: "Current password was not accepted or the new password could not be saved." }, { status: 400 }); }
}
