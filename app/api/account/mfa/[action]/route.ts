import { auth } from "@/server/auth/auth";
import { isSameOrigin } from "@/lib/security/origin";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { getClientIp } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const passwordSchema = z.object({ password: z.string().min(1).max(128) });
const codeSchema = z.object({ code: z.string().trim().min(1).max(100) });

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  const { action } = await params;
  if (!["enable", "disable", "verify", "backup"].includes(action)) return Response.json({ error: "Not found." }, { status: 404 });
  if (!await consumeRateLimit({ key: `mfa:${getClientIp(request.headers)}`, limit: 20, windowMs: 15 * 60 * 1000 })) return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const payload = await request.json().catch(() => null);
  if (action === "enable" || action === "disable") {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Sign in required." }, { status: 401 });
    const parsed = passwordSchema.safeParse(payload);
    if (!parsed.success) return Response.json({ error: "Enter your current password." }, { status: 400 });
    try {
      return action === "enable"
        ? await auth.api.enableTwoFactor({ body: parsed.data, headers: request.headers, asResponse: true })
        : await auth.api.disableTwoFactor({ body: parsed.data, headers: request.headers, asResponse: true });
    } catch { return Response.json({ error: "Your password was not accepted or MFA could not be updated." }, { status: 400 }); }
  }
  const parsed = codeSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Enter your verification code." }, { status: 400 });
  try {
    return action === "backup"
      ? await auth.api.verifyBackupCode({ body: { code: parsed.data.code, trustDevice: false }, headers: request.headers, asResponse: true })
      : await auth.api.verifyTOTP({ body: { code: parsed.data.code, trustDevice: false }, headers: request.headers, asResponse: true });
  } catch { return Response.json({ error: "The code was not accepted. Try a new code or use a recovery code." }, { status: 400 }); }
}
