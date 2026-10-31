import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookings } from "@/server/catalogue/queries";
import { isUpcomingBooking, needsBookingAttention } from "@/server/bookings/status";
import { EmptyState, LinkButton } from "@/components/ui";
import { BookingCard } from "@/components/booking-card";

export default async function AccountBookingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession();
  if (!session) return null;
  const allRows = await getCustomerBookings(session.user.id);
  const { view = "all" } = await searchParams;
  const now = new Date();
  const rows = allRows.filter(row => view === "upcoming" ? isUpcomingBooking(row.booking.status, row.startAt, now) : view === "past" ? row.startAt < now : view === "attention" ? needsBookingAttention(row.booking.status) : true);
  if (view === "upcoming") rows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return <div>
    <h1 className="display text-5xl leading-[.98] text-[var(--forest)]">Bookings</h1>
    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Current and previous CPD registrations, with the price recorded at checkout.</p>
    <nav aria-label="Booking views" className="mt-7 flex flex-wrap gap-2 border-b border-[var(--line)] pb-5">
      {[["all", "All bookings"], ["upcoming", "Upcoming"], ["past", "Past"], ["attention", "Needs attention"]].map(([value, label]) => <Link key={value} href={`/account/bookings?view=${value}`} aria-current={view === value ? "page" : undefined} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${view === value ? "bg-[var(--forest)] text-white" : "border border-[var(--line)] bg-white"}`}>{label}</Link>)}
    </nav>
    <div className="mt-8 grid gap-3">
      {rows.length ? rows.map(row => <BookingCard key={row.booking.id} booking={row.booking} startAt={row.startAt} showPrice />) : <EmptyState title="No bookings in this view" description="Your booking records will appear here." action={<LinkButton href="/classes">Browse classes</LinkButton>} />}
    </div>
  </div>;
}
