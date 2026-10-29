import type { BookingStatus } from "@/db/schema";

export function hasAttendanceEntitlement(status: BookingStatus): boolean {
  return status === "CONFIRMED" || status === "PARTIALLY_REFUNDED";
}

export function isUpcomingBooking(status: BookingStatus, startAt: Date, now = new Date()): boolean {
  return startAt >= now && hasAttendanceEntitlement(status);
}

export function needsBookingAttention(status: BookingStatus): boolean {
  return ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "PAYMENT_FAILED"].includes(status);
}
