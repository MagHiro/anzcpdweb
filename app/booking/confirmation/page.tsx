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
  const confirmed = row.booking.status === "CONFIRMED";
  const format = row.deliveryFormat === "ONLINE" ? "Online" : row.deliveryFormat === "IN_PERSON" ? "In person" : "Hybrid";
  return <Section className="confirmation-page"><Container>
    <header className="confirmation-header">
      {confirmed && <span className="confirmation-symbol"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.75 6 6 9-13.5" /></svg></span>}
      <h1>{confirmed ? "Your place is confirmed" : "Your booking"}</h1>
      <p>Booking reference <strong>{makePublicBookingReference(row.booking.id)}</strong></p>
    </header>
    {!confirmed && <BookingStatus status={row.booking.status} />}
    <div className="confirmation-grid">
      <section className="confirmation-activity" aria-labelledby="activity-title">
        <h2 id="activity-title">{row.booking.classTitleSnapshot}</h2>
        <dl className="confirmation-facts">
          <div><dt>When</dt><dd><time dateTime={row.startAt.toISOString()}>{formatDateTime(row.startAt, row.booking.timezoneSnapshot)}</time> to <time dateTime={row.endAt.toISOString()}>{formatDateTime(row.endAt, row.booking.timezoneSnapshot)}</time><span className="confirmation-timezone">{row.booking.timezoneSnapshot}</span></dd></div>
          <div><dt>Format</dt><dd>{format}</dd></div>
          {cpd && <div><dt>CPD</dt><dd>{cpd}</dd></div>}
          <div><dt>{row.deliveryFormat === "ONLINE" ? "Attendance" : "Location"}</dt><dd>{row.deliveryFormat === "ONLINE" ? entitled ? row.onlineAttendanceInfo || "See your booking email or account for attendance details." : "Attendance details will be available once your booking is confirmed." : row.venueName ?? "See class details"}</dd></div>
        </dl>
        <div className="mt-6"><LinkButton href={`/classes/${row.classSlug}`} variant="secondary">View class details</LinkButton></div>
      </section>
      <section className="confirmation-record" aria-labelledby="booking-details-title">
        <h2 id="booking-details-title">Booking details</h2>
        <dl className="confirmation-facts">
          <div><dt>Attendee</dt><dd>{row.booking.fullName}</dd></div>
          <div><dt>Email</dt><dd>{row.booking.email}</dd></div>
          <div><dt>Total</dt><dd>{free ? "Free · No payment required" : formatMoney(row.booking.amountSnapshot, row.booking.currencySnapshot)}</dd></div>
          {!free && <div><dt>Payment</dt><dd><StatusBadge status={row.payment.status} /></dd></div>}
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
