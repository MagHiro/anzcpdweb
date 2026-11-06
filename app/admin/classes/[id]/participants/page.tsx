import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { bookings } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import { getAdminClassById, getAdminReminderRows } from "@/server/catalogue/queries";
import { AdminParticipantControls } from "@/components/admin-participant-controls";
import { formatStatusLabel } from "@/components/ui";

export default async function ClassParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getAdminClassById(id);
  if (!row) notFound();
  const activity = row.class;
  // A class roster deliberately includes every eligible participant on one page.
  const participants = await getDb().select().from(bookings).where(and(eq(bookings.classId, id), inArray(bookings.status, ["CONFIRMED", "PARTIALLY_REFUNDED"]))).orderBy(asc(bookings.fullName), asc(bookings.id));
  const reminders = await getAdminReminderRows(participants.map(item => item.id), activity.startAt);
  const now = new Date();
  const hours = (activity.startAt.getTime() - now.getTime()) / 3600000;
  const reminderDays = ["PUBLISHED", "SOLD_OUT"].includes(activity.status) && hours > 0 ? hours <= 24 ? 1 : hours <= 72 ? 3 : undefined : undefined;
  return <div>
    <Link href="/admin/bookings?view=classes" className="ink-link">← Classes</Link>
    <h1 className="display mt-6 text-4xl text-[var(--forest)]">{activity.title}</h1>
    <p className="mt-3 text-sm text-[var(--muted)]">{formatDateTime(activity.startAt, activity.timezone)} · {activity.timezone}</p>
    <div className="mt-6 flex flex-wrap gap-5 text-sm"><a href={`/api/admin/bookings/export?classId=${id}`} className="ink-link">Export participants CSV</a><Link href={`/admin/classes/${id}`} className="ink-link">Manage class and resources</Link><Link href={`/admin/bookings?classId=${id}`} className="ink-link">All booking records</Link></div>
    <div className="mt-8 flex flex-wrap justify-between gap-3"><h2 className="display text-2xl text-[var(--forest)]">Participants ({participants.length})</h2><p className="text-sm text-[var(--muted)]">{participants.filter(item => item.attendance === "ATTENDED").length} attended · {participants.filter(item => item.attendance === "ABSENT").length} absent</p></div>
    <p className="mt-2 text-xs text-[var(--muted)]">Confirmed and partially refunded bookings. All participants are listed on this page.</p>
    <div className="mt-5 overflow-x-auto rounded-2xl bg-white"><table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-[var(--mist)]"><tr>{["Participant", "Professional identifier", "Reminders", "Attendance / actions"].map(label => <th key={label} scope="col" className="px-5 py-4 font-medium">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-[var(--line)]">{participants.map(participant => <tr key={participant.id}>
        <td data-label="Participant" className="px-5 py-5"><Link href={`/admin/bookings/${participant.id}`} className="ink-link">{participant.fullName}</Link><a href={`mailto:${participant.email}`} className="mt-1 block text-xs text-[var(--muted)]">{participant.email}</a></td>
        <td data-label="Professional identifier" className="px-5 py-5">{[participant.professionalIdentifierType, participant.professionalIdentifier].filter(Boolean).join(" ") || "Not supplied"}</td>
        <td data-label="Reminders" className="space-y-2 px-5 py-5 text-xs text-[var(--muted)]">{([3, 1] as const).map(days => {
          const reminder = reminders.find(item => item.bookingId === participant.id && item.daysBefore === String(days));
          const eligible = ["PUBLISHED", "SOLD_OUT"].includes(activity.status);
          return <p key={days}>{days}-day: {reminder ? reminder.status === "SENT" ? "Sent to provider" : formatStatusLabel(reminder.status) : !eligible ? "Not eligible" : now.getTime() < activity.startAt.getTime() - days * 86400000 ? "Scheduled" : "Not sent"}{reminder?.sentAt && <span className="block">{formatDateTime(reminder.sentAt, activity.timezone)}</span>}</p>;
        })}</td>
        <td data-label="Attendance / actions" className="px-5 py-5"><AdminParticipantControls bookingId={participant.id} attendance={participant.attendance} started={hours <= 0} reminderDays={reminderDays} /></td>
      </tr>)}</tbody>
    </table>{!participants.length && <p className="p-8 text-center text-sm text-[var(--muted)]">No confirmed participants yet.</p>}</div>
  </div>;
}
