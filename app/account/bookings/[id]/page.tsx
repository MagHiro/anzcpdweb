import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookingById } from "@/server/catalogue/queries";
import { hasAttendanceEntitlement } from "@/server/bookings/status";
import { uuidSchema } from "@/lib/validation";
import { CancelBookingForm } from "@/components/account-forms";
import { ActivityDetailIcon, StatusBadge } from "@/components/ui";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { formatDateTime, formatMoney, makePublicBookingReference } from "@/lib/utils";
import { getCpdLabel } from "@/lib/domain/countries";
import { getBookingJoinAccess } from "@/server/bookings/join";
import { getClassResources } from "@/server/bookings/resources";
import { RecordingPlayer } from "@/components/recording-player";
import "../bookings.css";

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return null;
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getCustomerBookingById(session.user.id, id);
  if (!row) notFound();
  const entitled = hasAttendanceEntitlement(row.booking.status);
  const resources = entitled ? await getClassResources(row.booking.classId, true) : [];
  const join = await getBookingJoinAccess(session.user.id, id);
  const cpd = getCpdLabel(row.booking.cpdUnitTypeSnapshot, row.booking.cpdAmountSnapshot);
  const zone = row.booking.timezoneSnapshot;
  const price = (amount: number) => formatMoney(amount, row.booking.currencySnapshot);
  const format = row.deliveryFormat === "ONLINE" ? "Online" : row.deliveryFormat === "HYBRID" ? "Online and in person" : "In person";
  const receipt = row.booking.paidAt || (row.booking.amountSnapshot === 0 && row.booking.confirmedAt);
  return <div className="customer-bookings customer-booking-detail">
    <Link href="/account/bookings" className="customer-booking-back focus-ring"><ArrowRight size={16} /> Back to bookings</Link>
    <header className="customer-booking-hero">
      <div className="customer-hero-status"><StatusBadge status={row.booking.status} /><span>{makePublicBookingReference(id)}</span></div>
      <h1>{row.booking.classTitleSnapshot}</h1>
      <div className="customer-hero-schedule">
        <div><ActivityDetailIcon kind="calendar" /><span><time dateTime={row.startAt.toISOString()}>{formatDateTime(row.startAt, zone)}</time><small>{zone}</small></span></div>
        <div><ActivityDetailIcon kind="location" /><span>{format}{row.deliveryFormat !== "ONLINE" && row.venueName && <small>{row.venueName}</small>}</span></div>
      </div>
    </header>
    <div className="customer-booking-columns">
      <div>
        {(entitled || join.state !== "hidden") && <section className="customer-detail-section">
          <h2>How to attend</h2>
          {entitled && <p className="whitespace-pre-wrap">{row.onlineAttendanceInfo || row.venueName || "We’ll send attendance details before the class."}</p>}
          {join.state === "available" && <a href={`/account/bookings/${id}/join`} target="_blank" rel="noopener noreferrer" className="customer-detail-action primary focus-ring">Join webinar <ArrowUpRight size={16} /></a>}
          {(join.state === "missing" || join.state === "ended") && <><button type="button" disabled className="customer-detail-action">Join webinar</button><p>{join.state === "ended" ? "The webinar has ended." : "The webinar link isn’t available yet."}</p></>}
        </section>}
        {resources.length > 0 && <section className="customer-detail-section"><h2>Materials and recordings</h2><ul className="customer-resource-list">
          {resources.map(resource => <li key={resource.id}>{resource.kind === "RECORDING" && resource.objectKey ? <><h3>{resource.title}</h3><RecordingPlayer id={resource.id} title={resource.title} /></> : <a href={`/api/class-resources/${resource.id}`} target={resource.kind === "RECORDING" ? "_blank" : undefined} rel="noreferrer" className="customer-resource-link focus-ring"><span>{resource.title}<small>{resource.kind === "MATERIAL" ? "Download PDF" : "Watch recording"}</small></span><ArrowRight size={16} /></a>}</li>)}
        </ul></section>}
        <section className="customer-detail-section">
          <h2>Attendee</h2>
          <dl className="customer-booking-facts"><div><dt>Name</dt><dd>{row.booking.fullName}</dd></div><div><dt>Email</dt><dd>{row.booking.email}</dd></div>{cpd && <div><dt>CPD</dt><dd>{cpd}</dd></div>}</dl>
          <p>Class emails go to the attendee. The booking stays in this account.</p>
        </section>
      </div>
      <div>
        <section className="customer-detail-section customer-payment-summary">
          <h2>Payment</h2>
          <dl className="customer-booking-facts">
            <div><dt>Booking price</dt><dd>{price(row.booking.amountSnapshot)}</dd></div>
            <div><dt>Amount paid</dt><dd>{price(row.payment?.amountCaptured ?? 0)}</dd></div>
            <div><dt>Refunded</dt><dd>{price(row.payment?.amountRefunded ?? 0)}</dd></div>
            {row.payment && <div><dt>Status</dt><dd><StatusBadge status={row.payment.status} /></dd></div>}
          </dl>
          {receipt && <Link href={`/booking/receipt/${id}`} className="customer-detail-action focus-ring">View receipt <ArrowRight size={16} /></Link>}
        </section>
        {row.booking.status === "PENDING_PAYMENT" && <section className="customer-detail-section"><h2>Cancel unpaid booking</h2><p>Cancelling closes checkout and releases the reserved place.</p><CancelBookingForm bookingId={id} /></section>}
        <section className="customer-detail-section"><h2>Booking help</h2><p>Include your booking reference when asking about attendance or a refund.</p><Link href="/account/support" className="customer-detail-action focus-ring">Contact support <ArrowRight size={16} /></Link></section>
      </div>
    </div>
  </div>;
}
