import { and, eq, inArray } from "drizzle-orm";
import { auditLogs, bookings, classes, classResources, emailOutbox } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSameOrigin } from "@/lib/security/origin";
import { requestAdmin } from "@/server/auth/admin-request";
import { classEmailSchema, resourceTemplateReady, uniqueClassRecipients, type ClassEmailMessage } from "@/server/email/class-email";
import { resourceReadiness } from "@/server/email/resource-readiness";
import { getServerEnv } from "@/lib/env";
import { consumeRateLimit } from "@/server/security/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  const admin = await requestAdmin(request.headers);
  if (!admin) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = classEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a valid resource email template." }, { status: 400 });
  if (!await consumeRateLimit({ key: `class-email:${admin.id}`, limit: 10, windowMs: 60_000 })) return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  const data = parsed.data;
  try {
    const result = await getDb().transaction(async tx => {
      const [activity] = await tx.select().from(classes).where(eq(classes.id, data.classId)).for("update").limit(1);
      if (!activity) return { error: "Class not found.", status: 404 };
      const [previous] = await tx.select().from(auditLogs).where(eq(auditLogs.id, data.campaignId)).limit(1);
      if (previous) {
        const metadata = previous.metadata as { count?: number; template?: string } | null;
        if (previous.action !== "RESOURCE_EMAIL_QUEUED" || previous.entityId !== data.classId || previous.actorUserId !== admin.id || metadata?.template !== data.template) return { error: "This request has already been used. Reload before sending a new email.", status: 409 };
        return { count: metadata?.count ?? 0 };
      }
      const resources = await tx.select().from(classResources).where(eq(classResources.classId, data.classId));
      if (!resourceTemplateReady(data.template, await resourceReadiness(resources))) return { error: "Publish the required materials and/or recording before sending this template. Materials must have an available PDF and recordings must have a valid HTTPS link.", status: 400 };
      const participants = await tx.select({ email: bookings.email, fullName: bookings.fullName }).from(bookings).where(and(eq(bookings.classId, data.classId), inArray(bookings.status, ["CONFIRMED", "PARTIALLY_REFUNDED"])));
      const recipients = uniqueClassRecipients(participants);
      if (!recipients.length) return { error: "This class has no active participants.", status: 400 };
      for (let offset = 0; offset < recipients.length; offset += 100) {
        await tx.insert(emailOutbox).values(recipients.slice(offset, offset + 100).map(recipient => {
          const payload: ClassEmailMessage = { type: "RESOURCE_SHARE", ...data, ...recipient, classTitle: activity.title, url: `${getServerEnv().APP_URL}/account/bookings` };
          return { dedupeKey: `resource-share:${data.campaignId}:${recipient.email}`, messageType: payload.type, recipientEmail: recipient.email, payload };
        }));
      }
      await tx.insert(auditLogs).values({ id: data.campaignId, actorUserId: admin.id, action: "RESOURCE_EMAIL_QUEUED", entityType: "class", entityId: data.classId, metadata: { template: data.template, count: recipients.length } });
      return { count: recipients.length };
    });
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ success: true, count: result.count });
  } catch {
    return Response.json({ error: "Unable to queue emails. Retry the same request safely." }, { status: 500 });
  }
}
