import { eq } from "drizzle-orm";
import { classResources } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { auth } from "@/server/auth/auth";
import { requestAdmin } from "@/server/auth/admin-request";
import { participantHasResourceAccess } from "@/server/bookings/resources";
import { readPrivatePdf } from "@/server/media/private-resources";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return new Response(null, { status: 404 });
  const [resource] = await getDb().select().from(classResources).where(eq(classResources.id, id));
  const admin = await requestAdmin(request.headers);
  if (!resource || (!admin && (!resource.published || !await participantHasResourceAccess(session.user.id, resource.classId)))) return new Response(null, { status: 404 });
  const headers = { "cache-control": "private, no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" };
  if (resource.kind === "RECORDING" && resource.recordingUrl) return new Response(null, { status: 302, headers: { ...headers, location: resource.recordingUrl } });
  if (!resource.objectKey) return new Response(null, { status: 404 });
  try {
    const bytes = await readPrivatePdf(resource.objectKey);
    return new Response(new Uint8Array(bytes), { headers: { ...headers, "content-type": "application/pdf", "content-disposition": `attachment; filename="class-material.pdf"` } });
  } catch { return Response.json({ error: "File temporarily unavailable." }, { status: 503, headers }); }
}
