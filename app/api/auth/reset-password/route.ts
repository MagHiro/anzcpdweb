import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid password." }, { status: 400 });
  try { return await auth.api.resetPassword({ body: { newPassword: parsed.data.password, token: parsed.data.token }, headers: request.headers, asResponse: true }); } catch { return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 }); }
}
