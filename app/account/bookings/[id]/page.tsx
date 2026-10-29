import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookingById } from "@/server/catalogue/queries";
import { hasAttendanceEntitlement } from "@/server/bookings/status";
import { uuidSchema } from "@/lib/validation";
import { CancelBookingForm } from "@/components/account-forms";
import { StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney, makePublicBookingReference } from "@/lib/utils";
import { getCpdLabel } from "@/lib/domain/countries";

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return null;
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getCustomerBookingById(session.user.id, id);
  if (!row) notFound();
  const entitled = hasAttendanceEntitlement(row.booking.status);
  const cpd = getCpdLabel(row.booking.cpdUnitTypeSnapshot, row.booking.cpdAmountSnapshot);
  return <div>
    <Link href="/account/bookings" className="ink-link">← Back to bookings</Link>
    <div className="mt-7 flex flex-wrap items-start justify-between gap-5">
      <div><h1 className="display max-w-3xl text-5xl leading-[.98] text-[var(--forest)]">{row.booking.classTitleSnapshot}</h1><p className="mt-3 text-sm text-[var(--muted)]">{makePublicBookingReference(row.booking.id)} · {formatDateTime(row.startAt, row.booking.timezoneSnapshot)}</p></div>
      <StatusBadge status={row.booking.status} />
    </div>
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-xl border border-[var(--line)] bg-white p-6">
        <h2 className="display text-3xl text-[var(--forest)]">Activity details</h2>
        <dl className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--muted)]">Attendee</dt><dd className="mt-2 font-semibold">{row.booking.fullName}</dd><dd className="mt-1 break-all text-[var(--muted)]">{row.booking.email}</dd></div>
          <div><dt className="text-[var(--muted)]">Delivery</dt><dd className="mt-2 font-semibold">{row.deliveryFormat.replaceAll("_", " ")}</dd></div>
          <div><dt className="text-[var(--muted)]">CPD</dt><dd className="mt-2 font-semibold">{cpd ?? "Not specified"}</dd></div>
          <div><dt className="text-[var(--muted)]">Booked price</dt><dd className="mt-2 font-semibold">{formatMoney(row.booking.amountSnapshot, row.booking.currencySnapshot)}</dd></div>
          <div><dt className="text-[var(--muted)]">Payment captured</dt><dd className="mt-2 font-semibold">{formatMoney(row.payment?.amountCaptured ?? 0, row.booking.currencySnapshot)}</dd></div>
          <div><dt className="text-[var(--muted)]">Refunded</dt><dd className="mt-2 font-semibold">{formatMoney(row.payment?.amountRefunded ?? 0, row.booking.currencySnapshot)}</dd></div>
        </dl>
        {row.payment && <div className="mt-6 flex items-center gap-3 text-sm">Payment status <StatusBadge status={row.payment.status} /></div>}
        <p className="mt-6 text-sm text-[var(--muted)]">This account manages the booking. The attendee named above receives class notices; a different attendee email does not automatically transfer account ownership.</p>
        {entitled && <div className="mt-8 border-t border-[var(--line)] pt-6"><h3 className="font-semibold">Attendance information</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{row.onlineAttendanceInfo || row.venueName || "Attendance details will be provided before the activity."}</p></div>}
      </section>
      <aside className="space-y-5">
        <section className="rounded-xl bg-[var(--forest)] p-6 text-white"><h2 className="display text-2xl">Need help?</h2><p className="mt-3 text-sm leading-6 text-white/70">For refund questions, attendance changes or account support, contact the academy with your booking reference.</p><Link href="/contact" className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[var(--forest)]">Contact support</Link></section>
        {row.booking.status === "PENDING_PAYMENT" && <section className="rounded-xl border border-[var(--line)] bg-white p-6"><h2 className="display text-2xl text-[var(--forest)]">Cancel unpaid booking</h2><p className="my-4 text-sm leading-6 text-[var(--muted)]">This closes an unpaid Checkout session and releases the reserved place.</p><CancelBookingForm bookingId={row.booking.id} /></section>}
      </aside>
    </div>
  </div>;
}
