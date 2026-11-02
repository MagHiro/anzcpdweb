import { BookingStatus } from "@/components/booking-status";
import { notFound } from "next/navigation";
import { getGuestBookingByToken } from "@/server/bookings/guest-access";
import { Container, LinkButton, Section, StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney, makePublicBookingReference } from "@/lib/utils";
import { getCpdLabel } from "@/lib/domain/countries";
import { ReceiptAccess } from "@/components/receipt-access";

export const dynamic = "force-dynamic";

export default async function GuestBookingConfirmationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  if (!params.token) notFound();
  const row = await getGuestBookingByToken(params.token);
  if (!row) notFound();
  const entitled = ["CONFIRMED", "PARTIALLY_REFUNDED"].includes(row.booking.status);
  const cpd = getCpdLabel(row.booking.cpdUnitTypeSnapshot, row.booking.cpdAmountSnapshot);
  const free = row.booking.amountSnapshot === 0;
  return <Section className="confirmation-page"><Container>
    <div className="confirmation-header">
      <div><h1 className="display">{row.booking.status === "CONFIRMED" ? "Your place is confirmed" : "Your booking"}</h1><p>Booking reference <strong>{makePublicBookingReference(row.booking.id)}</strong></p></div>
      {row.booking.status === "CONFIRMED" ? <StatusBadge status={row.booking.status} /> : null}
    </div>
    {row.booking.status !== "CONFIRMED" && <BookingStatus status={row.booking.status} />}
    <div className="confirmation-grid">
      <section className="confirmation-activity" aria-labelledby="activity-title">
        <h2 id="activity-title">{row.booking.classTitleSnapshot}</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <div><dt className="text-[var(--muted)]">When</dt><dd className="mt-1 font-semibold">{formatDateTime(row.startAt, row.booking.timezoneSnapshot)} – {formatDateTime(row.endAt, row.booking.timezoneSnapshot)}<span className="block text-xs font-normal text-[var(--muted)]">{row.booking.timezoneSnapshot}</span></dd></div>
          <div><dt className="text-[var(--muted)]">Format</dt><dd className="mt-1 font-semibold">{row.deliveryFormat === "ONLINE" ? "Online" : row.deliveryFormat.replaceAll("_", " ")}</dd></div>
          <div><dt className="text-[var(--muted)]">CPD</dt><dd className="mt-1 font-semibold">{cpd ?? "Not specified"}</dd></div>
          <div className="confirmation-attendance"><dt className="text-[var(--muted)]">{row.deliveryFormat === "ONLINE" ? "Attendance details" : "Location"}</dt><dd className="mt-1 font-semibold">{row.deliveryFormat === "ONLINE" ? entitled && row.onlineAttendanceInfo ? row.onlineAttendanceInfo : "Attendance details will be provided once your booking is confirmed." : row.venueName ?? "See class details"}</dd></div>
        </dl>
        <div className="mt-8"><LinkButton href={`/classes/${row.classSlug}`} variant="secondary">View activity details</LinkButton></div>
      </section>
      <section className="confirmation-record" aria-labelledby="booking-details-title">
        <h2 id="booking-details-title">Booking details</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <div><dt className="text-[var(--muted)]">Attendee</dt><dd className="mt-1 font-semibold">{row.booking.fullName}</dd></div>
          <div><dt className="text-[var(--muted)]">Email</dt><dd className="mt-1 break-all font-semibold">{row.booking.email}</dd></div>
          <div><dt className="text-[var(--muted)]">{free ? "Price" : "Amount"}</dt><dd className="mt-1 font-semibold">{free ? "Free · No payment required" : formatMoney(row.booking.amountSnapshot, row.booking.currencySnapshot)}</dd></div>
          {!free && <div><dt className="text-[var(--muted)]">Payment</dt><dd className="mt-1"><StatusBadge status={row.payment.status} /></dd></div>}
        </dl>
        {(row.booking.paidAt || (free && row.booking.confirmedAt)) && <div className="mt-6"><ReceiptAccess bookingId={row.booking.id} token={params.token} /></div>}
      </section>
    </div>
    <div className="confirmation-access">
      <p>This private link is time-limited. Create an account from your booking email to keep access to your bookings.</p>
      <LinkButton href="/register" variant="secondary">Create an account</LinkButton>
    </div>
  </Container></Section>;
}
