import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { nameSchema } from "@/lib/validation";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) { if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 }); const session = await auth.api.getSession({ headers: request.headers }); if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 }); const body = await request.json().catch(() => null) as { name?: string } | null; const parsed = nameSchema.safeParse(body?.name); if (!parsed.success) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 }); try { await auth.api.updateUser({ body: { name: parsed.data }, headers: request.headers }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Profile could not be updated." }, { status: 400 }); } }
