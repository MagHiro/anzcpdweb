import { describe, expect, it } from "vitest";
import { hasAttendanceEntitlement, isUpcomingBooking, needsBookingAttention } from "@/server/bookings/status";

describe("account booking views", () => {
  const now = new Date("2026-10-01T00:00:00Z");
  const future = new Date("2026-11-01T00:00:00Z");
  it("only counts confirmed attendance as upcoming", () => {
    expect(isUpcomingBooking("CONFIRMED", future, now)).toBe(true);
    expect(isUpcomingBooking("PARTIALLY_REFUNDED", future, now)).toBe(true);
    expect(isUpcomingBooking("PENDING_PAYMENT", future, now)).toBe(false);
    expect(isUpcomingBooking("PAYMENT_PROCESSING", future, now)).toBe(false);
    expect(isUpcomingBooking("CANCELLED", future, now)).toBe(false);
    expect(isUpcomingBooking("CONFIRMED", now, future)).toBe(false);
  });
  it("keeps unresolved payments visible without attendance entitlement", () => {
    for (const status of ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "PAYMENT_FAILED"] as const) {
      expect(needsBookingAttention(status)).toBe(true);
      expect(hasAttendanceEntitlement(status)).toBe(false);
    }
  });
});
