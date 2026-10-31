import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBookingById } from "@/server/catalogue/queries";
import { StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney, makePublicBookingReference } from "@/lib/utils";
import { RefundForm, AdminCancelBookingForm } from "@/components/refund-form";
import { uuidSchema } from "@/lib/validation";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getAdminBookingById(id);
  if (!row) notFound();
  const payment = row.payment;
  const refundable = payment ? Math.max(payment.amountCaptured - payment.amountRefunded, 0) : 0;
  return <div className="admin-booking-detail">
    <Link href="/admin/bookings" className="class-back-link focus-ring">← All bookings</Link>
    <header className="booking-detail-heading"><div><h1 className="display">{row.booking.fullName}</h1><a href={`mailto:${row.booking.email}`} className="booking-customer-email focus-ring">{row.booking.email}</a></div><StatusBadge status={row.booking.status} /></header>
    <div className="booking-detail-grid">
      <section className="admin-detail-panel"><h2>Booking details</h2><dl className="booking-record-fields">
        <div><dt>Reference</dt><dd>{makePublicBookingReference(row.booking.id)}</dd></div>
        <div><dt>Activity</dt><dd>{row.classTitle}</dd></div>
        <div><dt>Country</dt><dd>{row.booking.country === "AU" ? "Australia" : "New Zealand"}</dd></div>
        <div><dt>Professional identifier</dt><dd>{row.booking.professionalIdentifier ? `${row.booking.professionalIdentifierType ?? ""} ${row.booking.professionalIdentifier}`.trim() : "Not supplied"}</dd></div>
        <div><dt>Price at booking</dt><dd>{formatMoney(row.booking.amountSnapshot, row.booking.currencySnapshot)}</dd></div>
        <div><dt>Created</dt><dd>{formatDateTime(row.booking.createdAt, row.booking.timezoneSnapshot)}<span className="booking-timezone">{row.booking.timezoneSnapshot}</span></dd></div>
      </dl></section>
      <section className="admin-detail-panel"><h2>Payment</h2>{payment ? <><div className="mt-5"><StatusBadge status={payment.status} /></div><dl className="booking-payment-totals"><div><dt>Captured</dt><dd>{formatMoney(payment.amountCaptured, payment.currency)}</dd></div><div><dt>Refunded</dt><dd>{formatMoney(payment.amountRefunded, payment.currency)}</dd></div></dl></> : <p className="booking-payment-empty">No payment record for this booking.</p>}
        <details className="booking-provider-details"><summary className="focus-ring">Stripe references</summary><dl className="booking-record-fields"><div><dt>Checkout session</dt><dd>{row.booking.stripeCheckoutSessionId ?? "Not available"}</dd></div><div><dt>Payment intent</dt><dd>{row.booking.stripePaymentIntentId ?? "Not available"}</dd></div></dl></details>
      </section>
    </div>
    {payment && refundable > 0 && ["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(payment.status) && <section className="admin-detail-panel booking-refund-panel"><h2>Issue a refund</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Refunds are separate from cancellation. Stripe events confirm the final refund status.</p><div className="mt-6 max-w-xl"><RefundForm bookingId={row.booking.id} maxAmount={refundable} currency={payment.currency} /></div></section>}
    {!["CANCELLED", "REFUNDED"].includes(row.booking.status) && <section className="booking-cancel-panel"><div><h2>Cancel booking</h2><p>This cancels attendance only. Any refund must be issued separately.</p></div><AdminCancelBookingForm bookingId={row.booking.id} /></section>}
  </div>;
}
