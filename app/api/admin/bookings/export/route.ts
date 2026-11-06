import { and, asc, eq, inArray } from "drizzle-orm";
import { bookings, classes } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { csvCell } from "@/lib/csv";
import { requestAdmin } from "@/server/auth/admin-request";
import { writeAuditLog } from "@/server/audit";

export async function GET(request: Request) {
  const admin = await requestAdmin(request.headers);
  if (!admin) return Response.json({ error: "Administrator access required." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("classId");
  if (!uuidSchema.safeParse(id).success) return Response.json({ error: "Select a valid class." }, { status: 400 });
  const rows = await getDb().select({ booking: bookings, title: classes.title, startAt: classes.startAt, timezone: classes.timezone }).from(bookings).innerJoin(classes, eq(classes.id, bookings.classId))
    .where(and(eq(bookings.classId, id!), inArray(bookings.status, ["CONFIRMED", "PARTIALLY_REFUNDED"]))).orderBy(asc(bookings.fullName), asc(bookings.id));
  const lines = [["Name", "Email", "Professional identifier", "Class", "Start (UTC)", "Timezone", "Booking status", "Attendance"], ...rows.map(row => [row.booking.fullName, row.booking.email, row.booking.professionalIdentifier, row.title, row.startAt.toISOString(), row.timezone, row.booking.status, row.booking.attendance])];
  await writeAuditLog({ actorUserId: admin.id, action: "PARTICIPANTS_EXPORTED", entityType: "class", entityId: id!, metadata: { count: rows.length } });
  return new Response(`\uFEFF${lines.map(line => line.map(csvCell).join(",")).join("\r\n")}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="participants-${id}.csv"`, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
