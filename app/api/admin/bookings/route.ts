import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { bookings, classes, emailOutbox } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSameOrigin } from "@/lib/security/origin";
import { requestAdmin } from "@/server/auth/admin-request";
import { writeAuditLog } from "@/server/audit";
import { messageFor } from "@/server/email/reminders";
import { consumeRateLimit } from "@/server/security/rate-limit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("attendance"), bookingId: z.uuid(), attendance: z.enum(["NOT_RECORDED", "ATTENDED", "ABSENT"]) }),
  z.object({ action: z.literal("reminder"), bookingId: z.uuid(), daysBefore: z.union([z.literal(1), z.literal(3)]) }),
]);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  const admin = await requestAdmin(request.headers);
  if (!admin) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid booking update." }, { status: 400 });
  const data = parsed.data;
  const db = getDb();
  const [row] = await db.select({ booking: bookings, activity: classes }).from(bookings).innerJoin(classes, eq(bookings.classId, classes.id)).where(eq(bookings.id, data.bookingId));
  if (!row) return Response.json({ error: "Booking not found." }, { status: 404 });
  if (!["CONFIRMED", "PARTIALLY_REFUNDED"].includes(row.booking.status)) return Response.json({ error: "Only active participants can be updated." }, { status: 400 });
  if (data.action === "attendance") {
    if (row.activity.startAt > new Date()) return Response.json({ error: "Record attendance once the class has started." }, { status: 400 });
    await db.update(bookings).set({ attendance: data.attendance, attendanceRecordedAt: data.attendance === "NOT_RECORDED" ? null : new Date(), updatedAt: new Date() }).where(and(eq(bookings.id, data.bookingId), inArray(bookings.status, ["CONFIRMED", "PARTIALLY_REFUNDED"])));
  } else {
    if (row.activity.startAt <= new Date() || !["PUBLISHED", "SOLD_OUT"].includes(row.activity.status)) return Response.json({ error: "Reminders require an upcoming published class." }, { status: 400 });
    const hoursUntilStart = (row.activity.startAt.getTime() - Date.now()) / 3600000;
    if (hoursUntilStart > data.daysBefore * 24) return Response.json({ error: `This reminder can be resent within ${data.daysBefore} day(s) of the class.` }, { status: 400 });
    if (!await consumeRateLimit({ key: `admin-reminder:${data.bookingId}`, limit: 1, windowMs: 15 * 60 * 1000 })) return Response.json({ error: "A reminder was recently requested. Wait 15 minutes before resending." }, { status: 429 });
    const message = { ...messageFor(row.booking, row.activity, data.daysBefore), manual: true };
    await db.insert(emailOutbox).values({ dedupeKey: `manual-reminder:${crypto.randomUUID()}`, messageType: "EVENT_REMINDER", recipientEmail: row.booking.email, payload: message });
  }
  await writeAuditLog({ actorUserId: admin.id, action: data.action === "attendance" ? "ATTENDANCE_UPDATED" : "REMINDER_RESEND_REQUESTED", entityType: "booking", entityId: data.bookingId, metadata: data });
  return Response.json({ success: true });
}
