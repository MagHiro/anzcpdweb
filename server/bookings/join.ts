import { and, eq } from "drizzle-orm";
import { bookings, classes } from "@/db/schema";
import { getDb } from "@/lib/db";

export function webinarJoinState(input: { bookingStatus: string; classStatus: string; deliveryFormat: string; meetingLink: string | null; startAt: Date; endAt: Date; timezone: string }, now = new Date()) {
  if (!["CONFIRMED", "PARTIALLY_REFUNDED"].includes(input.bookingStatus) || !["PUBLISHED", "SOLD_OUT"].includes(input.classStatus) || input.deliveryFormat === "IN_PERSON") return "hidden";
  if (now >= input.endAt) return "ended";
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: input.timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  if (date.format(now) !== date.format(input.startAt)) return "upcoming";
  if (!input.meetingLink) return "missing";
  try {
    if (!["https:", "http:"].includes(new URL(input.meetingLink).protocol)) return "missing";
  } catch { return "missing"; }
  return "available";
}

export async function getBookingJoinAccess(userId: string, bookingId: string) {
  const [row] = await getDb().select({ bookingStatus: bookings.status, classStatus: classes.status, deliveryFormat: classes.deliveryFormat, meetingLink: classes.meetingLink, startAt: classes.startAt, endAt: classes.endAt, timezone: classes.timezone })
    .from(bookings).innerJoin(classes, eq(bookings.classId, classes.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId))).limit(1);
  if (!row) return { state: "hidden" as const, meetingLink: null };
  const state = webinarJoinState(row);
  return { state, meetingLink: state === "available" ? row.meetingLink : null, timezone: row.timezone };
}
