import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney, makePublicBookingReference } from "@/lib/utils";

export function BookingCard({ booking, startAt, showPrice = false }: {
  booking: { id: string; status: string; classTitleSnapshot: string; timezoneSnapshot: string; amountSnapshot: number; currencySnapshot: string };
  startAt: Date;
  showPrice?: boolean;
}) {
  return <Link href={`/account/bookings/${booking.id}`} className="booking-card focus-ring card-lift">
    <div className="booking-card-header">
      <p className="booking-card-date">{formatDateTime(startAt, booking.timezoneSnapshot)}</p>
      <StatusBadge status={booking.status} />
    </div>
    <h3 className="booking-card-title">{booking.classTitleSnapshot}</h3>
    <p className="booking-card-meta">{makePublicBookingReference(booking.id)}{showPrice && <> · Booked price {formatMoney(booking.amountSnapshot, booking.currencySnapshot)}</>}</p>
    <span className="booking-card-action">View booking <ArrowUpRight size={16} /></span>
  </Link>;
}
