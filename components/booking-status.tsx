import { StatusBadge } from "@/components/ui";
const descriptions: Record<string, string> = {
  PENDING_PAYMENT: "Payment has not been confirmed. If you have already paid, wait for your record to update before trying again.",
  PAYMENT_PROCESSING: "Your payment is being checked. Please do not pay again while it is processing.",
  CONFIRMED: "Your place is confirmed. Review the schedule and attendance details below before the activity.",
  PARTIALLY_REFUNDED: "A partial refund is recorded. Your booking remains active; check the payment record for details.",
  PAYMENT_FAILED: "Payment could not be completed. Check your payment record before starting a new booking.",
  CANCELLED: "This booking is cancelled. Cancellation and refunds are separate; contact the academy if you need help with a payment.",
  REFUNDED: "This booking has been refunded and no longer provides attendance access.",
  EXPIRED: "This reservation has expired. Visit the activity page to check whether places are still available.",
};
export function BookingStatus({ status }: { status: string }) {
  return <section aria-label="Booking status" className="mt-7 rounded-xl border border-[var(--line)] bg-[var(--mist)] p-5"><div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-semibold">Your booking status</h2><StatusBadge status={status} /></div><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{descriptions[status] ?? "Review your booking record for the latest information."}</p></section>;
}
