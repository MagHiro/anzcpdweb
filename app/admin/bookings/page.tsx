import Link from "next/link";
import { getAdminBookingClasses, getAdminBookingCount, getAdminBookingRows, getAdminReminderRows } from "@/server/catalogue/queries";
import { AdminParticipantControls } from "@/components/admin-participant-controls";
import { formatStatusLabel, Pagination, StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney as money } from "@/lib/utils";

const statuses = ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "CONFIRMED", "PAYMENT_FAILED", "CANCELLED", "PARTIALLY_REFUNDED", "REFUNDED", "EXPIRED"];
const control = "focus-ring min-h-11 min-w-0 rounded-xl bg-[var(--mist)] px-4 text-sm";
const linkStyle = "text-[var(--forest)] underline underline-offset-4";

export default async function AdminBookingsPage({ searchParams }: {
  searchParams: Promise<{ search?: string; status?: string; classId?: string; page?: string; view?: string; classSearch?: string; period?: string }>;
}) {
  const params = await searchParams;
  const byClass = params.view === "classes";
  const page = Math.min(Math.max(Math.floor(Number(params.page)) || 1, 1), 10_000);
  const activities = await getAdminBookingClasses();
  const selected = activities.find(activity => activity.id === params.classId);
  const filters = { search: params.search, status: params.status, classId: params.classId, participants: params.status === "participants" };
  const now = new Date();
  const matchingPeriod = (activity: typeof activities[number]) => params.period === "upcoming" ? activity.startAt >= now : params.period === "past" ? activity.startAt < now : true;
  const matchingClasses = activities.filter(activity => matchingPeriod(activity) && (!params.classSearch || activity.title.toLowerCase().includes(params.classSearch.trim().toLowerCase())));
  const [rows, total] = byClass ? [[], matchingClasses.length] : await Promise.all([
    getAdminBookingRows({ ...filters, page, pageSize: 25 }), getAdminBookingCount(filters),
  ]);
  const reminders = selected ? await getAdminReminderRows(rows.map(row => row.booking.id), selected.startAt) : [];
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    for (const key of byClass ? ["view", "classSearch", "period"] as const : ["search", "status", "classId"] as const) {
      if (params[key]) query.set(key, params[key]);
    }
    query.set("page", String(nextPage));
    return `/admin/bookings?${query}`;
  };
  const rosterHref = (id: string) => `/admin/classes/${id}/participants`;

  return <div>
    <h1 className="display text-5xl text-[var(--forest)]">Bookings</h1>
    <nav aria-label="Booking views" className="mt-7 flex gap-2">
      <Link href="/admin/bookings" aria-current={!byClass ? "page" : undefined} className={`focus-ring rounded-full px-5 py-3 text-sm ${!byClass ? "bg-[var(--forest)] text-white" : "text-[var(--forest)] hover:bg-[var(--mint)]"}`}>All bookings</Link>
      <Link href="/admin/bookings?view=classes" aria-current={byClass ? "page" : undefined} className={`focus-ring rounded-full px-5 py-3 text-sm ${byClass ? "bg-[var(--forest)] text-white" : "text-[var(--forest)] hover:bg-[var(--mint)]"}`}>By class</Link>
    </nav>

    {byClass ? <>
      <form key={`classes-${params.classSearch ?? ""}-${params.period ?? ""}`} className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4" method="get">
        <input type="hidden" name="view" value="classes" />
        <input aria-label="Search classes" className={`${control} flex-1`} name="classSearch" defaultValue={params.classSearch ?? ""} placeholder="Search classes" />
        <select aria-label="Class period" name="period" defaultValue={params.period ?? ""} className={control}><option value="">All dates</option><option value="upcoming">Upcoming classes</option><option value="past">Past classes</option></select>
        <button className="focus-ring rounded-xl bg-[var(--forest)] px-5 py-3 text-sm text-white">Filter</button>
        {(params.classSearch || params.period) && <Link href="/admin/bookings?view=classes" className={`${linkStyle} self-center px-2 text-sm`}>Clear</Link>}
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">{total} {total === 1 ? "class" : "classes"}</p>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[var(--mist)] text-[var(--forest)]"><tr>
            {['Class', 'Participants', 'Pending', 'Bookings', ''].map((heading, index) => <th key={index} scope="col" className="px-5 py-4 font-medium">{heading || <span className="sr-only">Actions</span>}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-[var(--line)]">{matchingClasses.slice((page - 1) * 25, page * 25).map(activity => <tr key={activity.id}>
            <td data-label="Class" className="px-5 py-5"><Link href={rosterHref(activity.id)} className={linkStyle}>{activity.title}</Link><span className="mt-1 block text-xs text-[var(--muted)]">{formatDateTime(activity.startAt, activity.timezone)} · {activity.timezone} · {formatStatusLabel(activity.status)}</span></td>
            <td data-label="Participants" className="px-5 py-5 tabular-nums">{activity.participants}{!activity.unlimitedCapacity && activity.seatCapacity ? <span className="text-[var(--muted)]"> / {activity.seatCapacity}</span> : null}</td>
            <td data-label="Pending" className="px-5 py-5 tabular-nums">{activity.pending}</td>
            <td data-label="Bookings" className="px-5 py-5"><Link href={`/admin/bookings?classId=${activity.id}`} className={linkStyle}>{activity.total}</Link></td>
            <td className="px-5 py-5"><Link href={rosterHref(activity.id)} aria-label={`View participants for ${activity.title}`} className={`${linkStyle} whitespace-nowrap`}>View participants</Link></td>
          </tr>)}</tbody>
        </table>
        {!total && <p className="p-10 text-center text-sm text-[var(--muted)]">No classes found.</p>}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Participants include confirmed and partially refunded bookings. Pending includes bookings awaiting or processing payment.</p>
    </> : <>
      <form key={`bookings-${params.search ?? ""}-${params.classId ?? ""}-${params.status ?? ""}`} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 lg:flex lg:items-center" method="get">
        <input aria-label="Search attendee or email" className={`${control} lg:flex-1`} name="search" defaultValue={params.search ?? ""} placeholder="Search attendee or email" />
        <select aria-label="Class" className={`${control} w-full lg:w-[min(32%,28rem)]`} name="classId" defaultValue={params.classId ?? ""}>
          <option value="">All classes</option>
          {params.classId && !selected && <option value={params.classId}>Class not found</option>}
          {activities.map(activity => <option key={activity.id} value={activity.id}>{activity.title} — {formatDateTime(activity.startAt, activity.timezone)}</option>)}
        </select>
        <select aria-label="Booking status" className={control} name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option><option value="participants">Participants only</option>
          {statuses.map(status => <option key={status} value={status}>{formatStatusLabel(status)}</option>)}
        </select>
        <button className="focus-ring rounded-xl bg-[var(--forest)] px-5 py-3 text-sm text-white">Filter</button>
        {(params.search || params.status || params.classId) && <Link href="/admin/bookings" className={`${linkStyle} px-2 text-sm`}>Clear</Link>}
      </form>

      {selected && <section aria-label="Selected class" className="mt-6 rounded-2xl bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="display text-2xl text-[var(--forest)]">{selected.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{formatDateTime(selected.startAt, selected.timezone)} · {selected.timezone}</p></div>
          <div className="flex flex-wrap gap-5 text-sm"><a href={`/api/admin/bookings/export?classId=${selected.id}`} className={linkStyle}>Export participants CSV</a><Link href={`/admin/classes/${selected.id}`} className={linkStyle}>Manage class</Link></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link href={rosterHref(selected.id)} className={linkStyle}>{selected.participants} participants{!selected.unlimitedCapacity && selected.seatCapacity ? ` / ${selected.seatCapacity} capacity` : ""}</Link>
          <span className="text-[var(--muted)]">{selected.pending} pending</span>
          <Link href={`/admin/bookings?classId=${selected.id}`} className={linkStyle}>{selected.total} total bookings</Link>
        </div>
      </section>}

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium text-[var(--forest)]">{params.status === "participants" ? "Participants" : "Booking list"}</h2>
        <p className="text-sm text-[var(--muted)]">{total ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total}` : "0 results"}</p>
      </div>
      {params.status === "participants" && <p className="mt-2 text-xs text-[var(--muted)]">Confirmed and partially refunded bookings only.</p>}
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white">
        <table className={`w-full ${selected ? "min-w-[640px]" : "min-w-[900px]"} text-left text-sm`}>
          <thead className="bg-[var(--mist)] text-[var(--forest)]"><tr>
            {['Attendee', ...(!selected ? ['Class'] : []), 'Amount', 'Status', 'Booked', ...(selected ? ['Reminders', 'Attendance / actions'] : [])].map(heading => <th key={heading} scope="col" className="px-5 py-4 font-medium">{heading}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-[var(--line)]">{rows.map(row => <tr key={row.booking.id}>
            <td data-label="Attendee" className="px-5 py-5"><Link href={`/admin/bookings/${row.booking.id}`} className={linkStyle}>{row.booking.fullName}</Link><span className="mt-1 block text-xs text-[var(--muted)]">{row.booking.email}</span></td>
            {!selected && <td data-label="Class" className="max-w-xl px-5 py-5"><Link href={rosterHref(row.booking.classId)} className={linkStyle}>{row.classTitle}</Link></td>}
            <td data-label="Amount" className="whitespace-nowrap px-5 py-5 tabular-nums">{money(row.booking.amountSnapshot, row.booking.currencySnapshot)}</td>
            <td data-label="Status" className="px-5 py-5"><StatusBadge status={row.booking.status} /></td>
            <td data-label="Booked" className="px-5 py-5 text-xs text-[var(--muted)]">{formatDateTime(row.booking.createdAt, "Australia/Sydney")}</td>
            {selected && <>
              <td data-label="Reminders" className="px-5 py-5 text-xs text-[var(--muted)]"><div className="min-w-36 space-y-2">{([3, 1] as const).map(days => {
                const reminder = reminders.find(item => item.bookingId === row.booking.id && item.daysBefore === String(days));
                const due = new Date(selected.startAt.getTime() - days * 86400000);
                const eligible = ["CONFIRMED", "PARTIALLY_REFUNDED"].includes(row.booking.status) && ["PUBLISHED", "SOLD_OUT"].includes(selected.status);
                return <p key={days}>{days}-day: {reminder ? (reminder.status === "SENT" ? "Sent to provider" : formatStatusLabel(reminder.status)) : !eligible ? "Not eligible" : now < due ? "Scheduled" : "Not sent"}{reminder?.sentAt && <span className="block">{formatDateTime(reminder.sentAt, selected.timezone)}</span>}</p>;
              })}</div></td>
              <td data-label="Attendance / actions" className="px-5 py-5">{["CONFIRMED", "PARTIALLY_REFUNDED"].includes(row.booking.status) ? <AdminParticipantControls bookingId={row.booking.id} attendance={row.booking.attendance} started={selected.startAt <= now} reminderDays={selected.startAt > now && ["PUBLISHED", "SOLD_OUT"].includes(selected.status) ? (selected.startAt.getTime() - now.getTime() <= 86400000 ? 1 : selected.startAt.getTime() - now.getTime() <= 3 * 86400000 ? 3 : undefined) : undefined} /> : <span className="text-xs text-[var(--muted)]">Not an active participant</span>}</td>
            </>}
          </tr>)}</tbody>
        </table>
        {!rows.length && <p className="p-10 text-center text-sm text-[var(--muted)]">{params.status === "participants" ? "No participants match these filters." : "No bookings match these filters."}</p>}
      </div>
    </>}
    <Pagination page={page} hasNext={page * 25 < total} previousHref={pageHref(page - 1)} nextHref={pageHref(page + 1)} />
  </div>;
}
