import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { bookings, classes, emailOutbox } from "@/db/schema";
import { getDb } from "@/lib/db";

export type EventReminderMessage = {
  type: "EVENT_REMINDER";
  bookingId: string;
  eventStartAt: string;
  daysBefore: 1 | 3;
  manual?: boolean;
  email: string;
  name: string;
  classTitle: string;
  classDate: string;
  classTime: string;
  deliveryFormat: "ONLINE" | "IN_PERSON" | "HYBRID";
  meetingLink?: string;
  venueName?: string;
  venueAddress?: string;
};

const hour = 60 * 60 * 1000;
const activeBookings = ["CONFIRMED", "PARTIALLY_REFUNDED"] as const;
const activeClasses = ["PUBLISHED", "SOLD_OUT"] as const;

export function reminderIsDue(startAt: Date, daysBefore: 1 | 3, now: Date) {
  const due = startAt.getTime() - daysBefore * 24 * hour;
  // One-hour recovery window; never send old reminders after an extended outage.
  return now.getTime() >= due && now.getTime() < due + hour;
}

export function messageFor(booking: typeof bookings.$inferSelect, activity: typeof classes.$inferSelect, daysBefore: 1 | 3): EventReminderMessage {
  return {
    type: "EVENT_REMINDER", bookingId: booking.id, eventStartAt: activity.startAt.toISOString(), daysBefore,
    email: booking.email, name: booking.fullName, classTitle: activity.title,
    classDate: new Intl.DateTimeFormat("en-AU", { timeZone: activity.timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(activity.startAt),
    classTime: `${new Intl.DateTimeFormat("en-AU", { timeZone: activity.timezone, hour: "numeric", minute: "2-digit", timeZoneName: "longOffset" }).format(activity.startAt)} (${activity.timezone})`,
    deliveryFormat: activity.deliveryFormat, meetingLink: activity.meetingLink ?? undefined,
    venueName: activity.venueName ?? undefined, venueAddress: activity.venueAddress ?? undefined,
  };
}

export async function enqueueEventReminders(now = new Date()) {
  const db = getDb();
  let queued = 0;
  for (const daysBefore of [3, 1] as const) {
    const rows = await db.select({ booking: bookings, activity: classes }).from(bookings)
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(and(inArray(bookings.status, activeBookings), inArray(classes.status, activeClasses),
        gt(classes.startAt, new Date(now.getTime() + daysBefore * 24 * hour - hour)),
        lte(classes.startAt, new Date(now.getTime() + daysBefore * 24 * hour))));
    for (const { booking, activity } of rows) {
      const message = messageFor(booking, activity, daysBefore);
      const inserted = await db.insert(emailOutbox).values({
        dedupeKey: `event-reminder:${booking.id}:${activity.startAt.toISOString()}:${daysBefore}`,
        messageType: message.type, recipientEmail: message.email, payload: message,
      }).onConflictDoNothing({ target: emailOutbox.dedupeKey }).returning({ id: emailOutbox.id });
      queued += inserted.length;
    }
  }
  return queued;
}

// Recheck on every delivery/retry so cancellations, rescheduling and link edits are respected.
export async function refreshEventReminder(message: EventReminderMessage, now = new Date()) {
  const [row] = await getDb().select({ booking: bookings, activity: classes }).from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id)).where(eq(bookings.id, message.bookingId)).limit(1);
  if (!row || !activeBookings.includes(row.booking.status as typeof activeBookings[number]) ||
    !activeClasses.includes(row.activity.status as typeof activeClasses[number]) ||
    row.activity.startAt.toISOString() !== message.eventStartAt || (message.manual ? row.activity.startAt <= now : !reminderIsDue(row.activity.startAt, message.daysBefore, now))) return null;
  return { ...messageFor(row.booking, row.activity, message.daysBefore), ...(message.manual ? { manual: true } : {}) };
}
