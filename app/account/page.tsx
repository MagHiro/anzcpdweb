import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookings } from "@/server/catalogue/queries";
import { EmptyState, LinkButton, StatusBadge } from "@/components/ui";
import { formatDateTime, makePublicBookingReference } from "@/lib/utils";

export default async function AccountOverviewPage() {
  const session = await getServerSession();
  if (!session) return null;
  const rows = await getCustomerBookings(session.user.id);
  const upcoming = rows.filter((row) => row.startAt >= new Date() && ["CONFIRMED", "PARTIALLY_REFUNDED", "PAYMENT_PROCESSING", "PENDING_PAYMENT"].includes(row.booking.status));
  return <div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[var(--fern)]">Customer account</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Good to see you, {session.user.name.split(" ")[0]}.</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Your bookings, payment states and CPD records in one place.</p></div><LinkButton href="/classes">Browse classes</LinkButton></div><section className="mt-10"><div className="flex items-center justify-between gap-4"><h2 className="display text-3xl text-[var(--forest)]">Upcoming</h2><Link href="/account/bookings" className="text-sm font-bold text-[var(--forest)] underline underline-offset-4">All bookings</Link></div>{upcoming.length ? <div className="mt-5 grid gap-4">{upcoming.map((row) => <Link key={row.booking.id} href={`/account/bookings/${row.booking.id}`} className="group rounded-[1.4rem] border border-[var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#a9c7bd]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--fern)]">{formatDateTime(row.startAt, row.timezone)}</p><h3 className="display mt-2 text-2xl text-[var(--forest)]">{row.classTitle}</h3><p className="mt-2 text-sm text-[var(--muted)]">{makePublicBookingReference(row.booking.id)}</p></div><StatusBadge status={row.booking.status} /></div></Link>)}</div> : <div className="mt-5"><EmptyState title="No upcoming bookings." description="You don’t have any confirmed or active CPD bookings yet." action={<LinkButton href="/classes">Browse classes</LinkButton>} /></div>}</section></div>;
}
