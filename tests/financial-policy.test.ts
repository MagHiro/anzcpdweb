import { describe, expect, it } from "vitest";
import { remainingRefundableAmount } from "@/server/payments/refund-policy";
import { canTransitionBooking } from "@/server/bookings/transitions";

describe("financial policies", () => {
  it("deducts successful refunds exactly once", () => {
    expect(remainingRefundableAmount(10000, 3000, 0)).toBe(7000);
    expect(remainingRefundableAmount(10000, 3000, 2000)).toBe(5000);
    expect(remainingRefundableAmount(10000, 10000, 0)).toBe(0);
  });
  it("never exposes a negative refundable balance", () => {
    expect(remainingRefundableAmount(1000, 900, 200)).toBe(0);
  });
  it("allows cancellation after a partial refund", () => {
    expect(canTransitionBooking("PARTIALLY_REFUNDED", "CANCELLED")).toBe(true);
    expect(canTransitionBooking("CANCELLED", "CONFIRMED")).toBe(false);
  });
});
