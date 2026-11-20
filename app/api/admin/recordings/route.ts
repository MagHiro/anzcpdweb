import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { classResources, classes } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSameOrigin } from "@/lib/security/origin";
import { requestAdmin } from "@/server/auth/admin-request";
import { writeAuditLog } from "@/server/audit";
import { appendRecordingChunk, RECORDING_CHUNK_BYTES } from "@/server/media/private-recordings";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const admin = await requestAdmin(request.headers);
  if (!admin) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 4096) return new Response(null, { status: 413 });
  const parsed = z.object({ classId: z.uuid(), title: z.string().trim().min(1).max(180) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a recording title and class." }, { status: 400 });
  const db = getDb();
  if (!(await db.select({ id: classes.id }).from(classes).where(eq(classes.id, parsed.data.classId))).length) return new Response(null, { status: 404 });
  const [resource] = await db.insert(classResources).values({ ...parsed.data, kind: "RECORDING", objectKey: `${randomUUID()}.mp4` }).returning({ id: classResources.id });
  await writeAuditLog({ actorUserId: admin.id, action: "CLASS_RESOURCE_ADD", entityType: "class", entityId: parsed.data.classId, metadata: { resourceId: resource.id } });
  return Response.json(resource);
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request) || !await requestAdmin(request.headers)) return new Response(null, { status: 403 });
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return new Response(null, { status: 404 });
  const [resource] = await getDb().select().from(classResources).where(eq(classResources.id, id.data));
  if (!resource || resource.kind !== "RECORDING" || !resource.objectKey || resource.published) return new Response(null, { status: 404 });
  if (!request.body || Number(request.headers.get("content-length")) > RECORDING_CHUNK_BYTES) return new Response(null, { status: 413 });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > RECORDING_CHUNK_BYTES) { await reader.cancel(); return new Response(null, { status: 413 }); }
      chunks.push(value);
    }
    const offsetHeader = request.headers.get("x-upload-offset");
    const totalHeader = request.headers.get("x-upload-total");
    if (!offsetHeader || !totalHeader) throw new Error("Missing upload position.");
    const complete = await appendRecordingChunk(resource.objectKey, Number(offsetHeader), Number(totalHeader), Buffer.concat(chunks));
    return Response.json({ complete });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Recording upload failed." }, { status: 400 });
  }
}
