import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookings } from "@/server/catalogue/queries";
import { isUpcomingBooking, needsBookingAttention } from "@/server/bookings/status";
import { StatusBadge } from "@/components/ui";
import { ArrowRight } from "@/components/icon";
import { formatDate, formatTime, formatMoney, makePublicBookingReference } from "@/lib/utils";
import "./bookings.css";

const views = { all: "All bookings", upcoming: "Upcoming", past: "Past", attention: "Payment status" } as const;
const emptyCopy = { all: "No bookings yet", upcoming: "No upcoming bookings", past: "No past bookings", attention: "No pending or failed payments" } as const;

export default async function AccountBookingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession();
  if (!session) return null;
  const allRows = await getCustomerBookings(session.user.id);
  const { view: requested } = await searchParams;
  const view = requested && Object.hasOwn(views, requested) ? requested as keyof typeof views : "all";
  const now = new Date();
  const rows = allRows.filter(row => view === "upcoming" ? isUpcomingBooking(row.booking.status, row.startAt, now) : view === "past" ? row.startAt < now : view === "attention" ? needsBookingAttention(row.booking.status) : true);
  if (view === "upcoming") rows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return <div className="customer-bookings">
    <h1>Bookings</h1>
    <nav aria-label="Booking views" className="customer-booking-tabs">
      {Object.entries(views).map(([value, label]) => <Link key={value} href={`/account/bookings?view=${value}`} aria-current={view === value ? "page" : undefined} className="focus-ring">{label}</Link>)}
    </nav>
    {rows.length ? <ul className="customer-booking-list">
      {rows.map(({ booking, startAt, deliveryFormat, venueName }) => <li key={booking.id}>
        <Link href={`/account/bookings/${booking.id}`} className="customer-booking-ticket focus-ring">
          <div className="customer-ticket-header">
            <time dateTime={startAt.toISOString()}>{formatDate(startAt, booking.timezoneSnapshot)}</time>
            <StatusBadge status={booking.status} />
          </div>
          <div className="customer-ticket-body">
            <h2>{booking.classTitleSnapshot}</h2>
            <p>{formatTime(startAt, booking.timezoneSnapshot)} ({booking.timezoneSnapshot})</p>
            <p>{deliveryFormat === "ONLINE" ? "Online" : deliveryFormat === "HYBRID" ? `Online and ${venueName || "in person"}` : venueName || "In person"}</p>
            <p>{makePublicBookingReference(booking.id)}</p>
          </div>
          <div className="customer-ticket-footer"><span>{booking.amountSnapshot === 0 ? "Free" : formatMoney(booking.amountSnapshot, booking.currencySnapshot)}</span><span>View booking <ArrowRight size={16} /></span></div>
        </Link>
      </li>)}
    </ul> : <section className="customer-booking-empty"><h2>{emptyCopy[view]}</h2><Link href={view === "all" ? "/classes" : "/account/bookings"} className="ink-link focus-ring">{view === "all" ? "Browse classes" : "All bookings"}</Link></section>}
  </div>;
}
