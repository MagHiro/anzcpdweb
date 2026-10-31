import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookings } from "@/server/catalogue/queries";
import { EmptyState, LinkButton, MetricCard } from "@/components/ui";
import { BookingCard } from "@/components/booking-card";
import { isUpcomingBooking } from "@/server/bookings/status";

export default async function AccountOverviewPage() {
  const session = await getServerSession();
  if (!session) return null;
  const rows = await getCustomerBookings(session.user.id);
  const upcoming = rows.filter(row => isUpcomingBooking(row.booking.status, row.startAt)).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return <div>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><h1 className="display">Good to see you, {session.user.name.split(" ")[0]}.</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Your upcoming activities, booking records and payment status in one place.</p></div>
      <LinkButton href="/classes">Browse classes</LinkButton>
    </div>
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <MetricCard label="Upcoming" value={upcoming.length} detail="Active or confirmed bookings" href="/account/bookings?view=upcoming" />
      <MetricCard label="All bookings" value={rows.length} detail="All booking records" href="/account/bookings" />
      <MetricCard label="Account" value="Secure" detail="Email and profile settings" href="/account/profile" />
    </div>
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4"><h2 className="display">Upcoming</h2><Link href="/account/bookings" className="ink-link">All bookings</Link></div>
      {upcoming.length ? <div className="mt-5 grid gap-6 md:grid-cols-2">{upcoming.map(row => <BookingCard key={row.booking.id} booking={row.booking} startAt={row.startAt} />)}</div> : <div className="mt-5"><EmptyState title="No upcoming bookings." description="Browse the catalogue to find your next activity." action={<LinkButton href="/classes">Browse classes</LinkButton>} /></div>}
    </section>
  </div>;
}
