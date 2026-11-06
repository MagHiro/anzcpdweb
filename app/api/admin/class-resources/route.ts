import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { classResources, classes } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSameOrigin } from "@/lib/security/origin";
import { requestAdmin } from "@/server/auth/admin-request";
import { deletePrivatePdf, storePrivatePdf } from "@/server/media/private-resources";
import { writeAuditLog } from "@/server/audit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  const admin = await requestAdmin(request.headers);
  if (!admin) return Response.json({ error: "Administrator access required." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) return Response.json({ error: "Upload is too large." }, { status: 413 });
  const form = await request.formData().catch(() => null);
  const parsed = z.object({ classId: z.uuid(), action: z.enum(["add", "publish", "hide", "remove"]) }).safeParse(form && Object.fromEntries(form));
  if (!parsed.success || !form) return Response.json({ error: "Invalid resource request." }, { status: 400 });
  const { classId, action } = parsed.data;
  const db = getDb();
  if (!(await db.select({ id: classes.id }).from(classes).where(eq(classes.id, classId))).length) return Response.json({ error: "Class not found." }, { status: 404 });
  let resourceId: string;
  if (action === "add") {
    const title = z.string().trim().min(1).max(180).safeParse(form.get("title"));
    const kind = form.get("kind");
    if (!title.success || !["MATERIAL", "RECORDING"].includes(String(kind))) return Response.json({ error: "Enter a title and resource type." }, { status: 400 });
    let objectKey: string | undefined;
    let recordingUrl: string | undefined;
    try {
      if (kind === "MATERIAL") {
        const file = form.get("file");
        if (!(file instanceof File)) throw new Error("Choose a PDF.");
        objectKey = await storePrivatePdf(file);
      } else {
        const url = z.url().max(2000).safeParse(form.get("recordingUrl"));
        if (!url.success) throw new Error("Enter a valid HTTPS recording URL.");
        const target = new URL(url.data);
        if (target.protocol !== "https:" || target.username || target.password) throw new Error("Use an HTTPS link without credentials.");
        recordingUrl = target.href;
      }
      const [created] = await db.insert(classResources).values({ classId, title: title.data, kind: String(kind), objectKey, recordingUrl }).returning({ id: classResources.id });
      resourceId = created.id;
    } catch (error) {
      if (objectKey) await deletePrivatePdf(objectKey).catch(() => undefined);
      return Response.json({ error: error instanceof Error ? error.message : "Resource could not be saved." }, { status: 400 });
    }
  } else {
    const id = z.uuid().safeParse(form.get("resourceId"));
    if (!id.success) return Response.json({ error: "Invalid resource." }, { status: 400 });
    resourceId = id.data;
    const condition = and(eq(classResources.id, resourceId), eq(classResources.classId, classId));
    const [resource] = await db.select().from(classResources).where(condition);
    if (!resource) return Response.json({ error: "Resource not found." }, { status: 404 });
    if (action === "remove") {
      await db.delete(classResources).where(condition);
      if (resource.objectKey) await deletePrivatePdf(resource.objectKey).catch(() => undefined);
    } else await db.update(classResources).set({ published: action === "publish", updatedAt: new Date() }).where(condition);
  }
  await writeAuditLog({ actorUserId: admin.id, action: `CLASS_RESOURCE_${action.toUpperCase()}`, entityType: "class", entityId: classId, metadata: { resourceId } });
  return Response.json({ success: true });
}
