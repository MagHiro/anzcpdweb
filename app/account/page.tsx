import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookings } from "@/server/catalogue/queries";
import { ActivityDetailIcon, StatusBadge } from "@/components/ui";
import { ArrowRight } from "@/components/icon";
import { formatTime, makePublicBookingReference } from "@/lib/utils";
import { isUpcomingBooking, needsBookingAttention } from "@/server/bookings/status";
import "./overview.css";

type BookingRow = Awaited<ReturnType<typeof getCustomerBookings>>[number];

function ScheduleDate({ row }: { row: BookingRow }) {
  const timeZone = row.booking.timezoneSnapshot;
  const { day, month, year } = Object.fromEntries(new Intl.DateTimeFormat("en-AU", {
    day: "numeric", month: "short", year: "numeric", timeZone,
  }).formatToParts(row.startAt).map(({ type, value }) => [type, value]));
  return <time className="account-schedule-date" dateTime={row.startAt.toISOString()}>
    <span>{day}</span>{" "}<span>{month} {year}</span>
  </time>;
}

function ScheduleDetails({ row }: { row: BookingRow }) {
  const zone = row.booking.timezoneSnapshot;
  const location = row.deliveryFormat === "ONLINE" ? "Online" : row.deliveryFormat === "HYBRID"
    ? `Online and ${row.venueName || "in person"}` : row.venueName || "In person";
  return <div className="account-schedule-details">
    <span><ActivityDetailIcon kind="clock" /><span>{formatTime(row.startAt, zone)} <span className="account-schedule-zone">({zone})</span></span></span>
    <span>{row.deliveryFormat === "ONLINE" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8m-4-4v4" strokeLinecap="round" /></svg> : <ActivityDetailIcon kind="location" />}<span>{location}</span></span>
  </div>;
}

export default async function AccountOverviewPage() {
  const session = await getServerSession();
  if (!session) return null;
  const rows = await getCustomerBookings(session.user.id);
  const now = new Date();
  const [next, ...later] = rows.filter(row => isUpcomingBooking(row.booking.status, row.startAt, now)).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const attention = rows.filter(row => needsBookingAttention(row.booking.status)).length;
  return <div className="account-overview">
    <header className="account-overview-header">
      <h1>My account</h1>
      <Link href="/account/bookings" className="account-overview-link focus-ring">All bookings <ArrowRight /></Link>
    </header>
    {attention > 0 && <Link href="/account/bookings?view=attention" className="account-payment-link focus-ring">
      <span>Check payment for {attention} {attention === 1 ? "booking" : "bookings"}</span><ArrowRight />
    </Link>}
    {next ? <>
      <section aria-labelledby="account-next-class">
        <h2 id="account-next-class" className="account-overview-section-title">Next class</h2>
        <article className="account-next-class">
          <div className="account-next-date"><ScheduleDate row={next} /></div>
          <div className="account-next-content">
            <StatusBadge status={next.booking.status} />
            <h3>{next.booking.classTitleSnapshot}</h3>
            <ScheduleDetails row={next} />
            <div className="account-next-footer">
              <Link href={`/account/bookings/${next.booking.id}`} className="account-next-action focus-ring">View booking <ArrowRight /></Link>
              <span>{makePublicBookingReference(next.booking.id)}</span>
            </div>
          </div>
        </article>
      </section>
      {later.length > 0 && <section className="account-later" aria-labelledby="account-later-title">
        <h2 id="account-later-title" className="account-overview-section-title">More upcoming classes</h2>
        <ul className="account-agenda">
          {later.map(row => <li key={row.booking.id}>
            <Link href={`/account/bookings/${row.booking.id}`} className="account-agenda-row focus-ring">
              <ScheduleDate row={row} />
              <div className="account-agenda-class">
                <h3>{row.booking.classTitleSnapshot}</h3>
                <ScheduleDetails row={row} />
              </div>
              <div className="account-agenda-footer">
                <StatusBadge status={row.booking.status} />
                <span className="account-agenda-action">View booking <ArrowRight size={16} /></span>
              </div>
            </Link>
          </li>)}
        </ul>
      </section>}
    </> : <section className="account-no-classes" aria-labelledby="account-no-classes-title">
      <ActivityDetailIcon kind="calendar" />
      <h2 id="account-no-classes-title">No upcoming classes</h2>
      <Link href="/classes" className="account-next-action focus-ring">Browse classes <ArrowRight /></Link>
    </section>}
  </div>;
}
