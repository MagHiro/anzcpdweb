import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { getDb } from "@/lib/db";
import { user } from "@/db/schema";
import { updatePrimaryMedia } from "@/server/catalogue/service";
import { validateImage, storeImage } from "@/server/media/storage";
import { uuidSchema } from "@/lib/validation";
import { writeAuditLog } from "@/server/audit";
import { isSameOrigin } from "@/lib/security/origin";
import { safeErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [accountUser] = await getDb().select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (accountUser?.role !== "ADMIN") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const form = await request.formData();
  const classId = String(form.get("classId") ?? "");
  const altText = String(form.get("altText") ?? "").trim();
  const file = form.get("file");
  if (!uuidSchema.safeParse(classId).success || !(file instanceof File) || !altText) return NextResponse.json({ error: "Class, image and alt text are required." }, { status: 400 });
  const valid = validateImage(file);
  if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 });
  try { const stored = await storeImage({ classId, file, extension: valid.extension }); const media = await updatePrimaryMedia(classId, { ...stored, altText }); await writeAuditLog({ actorUserId: session.user.id, action: "CLASS_MEDIA_UPDATED", entityType: "class", entityId: classId, metadata: { mediaId: media.id, mimeType: media.mimeType, byteSize: media.byteSize } }); return NextResponse.redirect(new URL(`/admin/classes/${classId}`, request.url)); } catch (error) { return NextResponse.json({ error: safeErrorMessage(error, "Image upload failed. No class data was changed.") }, { status: 400 }); }
}
