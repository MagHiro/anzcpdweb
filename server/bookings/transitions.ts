import type { BookingStatus } from "@/db/schema";

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING_PAYMENT: ["PAYMENT_PROCESSING", "CONFIRMED", "PAYMENT_FAILED", "CANCELLED", "EXPIRED"],
  PAYMENT_PROCESSING: ["CONFIRMED", "PAYMENT_FAILED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["PARTIALLY_REFUNDED", "REFUNDED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED"],
  CANCELLED: ["PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUNDED"],
  REFUNDED: [],
  EXPIRED: ["CONFIRMED", "CANCELLED"],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return from === to || transitions[from].includes(to);
}

export function assertBookingTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransitionBooking(from, to)) throw new Error(`Booking cannot transition from ${from} to ${to}.`);
}

export function getAllowedBookingTransitions(from: BookingStatus): readonly BookingStatus[] {
  return transitions[from];
}
