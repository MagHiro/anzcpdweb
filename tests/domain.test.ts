import { describe, expect, it } from "vitest";
import { bookingFormSchema, professionalIdentifierSchema, refundFormSchema } from "@/lib/validation";
import { canTransitionBooking } from "@/server/bookings/transitions";
import { canReserveSeat, getRemainingSeats } from "@/server/bookings/capacity";
import { isAdmin, ownsBooking } from "@/lib/authorization";
import { formatMoney, publicErrorMessage, safeInternalPath } from "@/lib/utils";

describe("booking validation", () => {
  it("requires matching email and explicit policy acceptance", () => {
    const result = bookingFormSchema.safeParse({ classSlug: "ethical-standards", fullName: "Alex Morgan", email: "alex@example.com", emailConfirmation: "other@example.com", professionalIdentifier: "123456", termsAccepted: "on", refundPolicyAccepted: "on", idempotencyKey: "00000000-0000-4000-8000-000000000000" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "emailConfirmation")).toBe(true);
  });

  it("keeps country identifier rules distinct", () => {
    expect(professionalIdentifierSchema("AU", true).safeParse("123456").success).toBe(true);
    expect(professionalIdentifierSchema("AU", true).safeParse("MARA-123").success).toBe(false);
    expect(professionalIdentifierSchema("NZ", true).safeParse("IAA-12345").success).toBe(true);
  });
});

describe("booking lifecycle and capacity", () => {
  it("allows only defined financial transitions", () => {
    expect(canTransitionBooking("PENDING_PAYMENT", "CONFIRMED")).toBe(true);
    expect(canTransitionBooking("PAYMENT_FAILED", "CONFIRMED")).toBe(true);
    expect(canTransitionBooking("REFUNDED", "CONFIRMED")).toBe(false);
    expect(canTransitionBooking("CONFIRMED", "REFUNDED")).toBe(true);
  });

  it("does not report more available seats than capacity", () => {
    expect(getRemainingSeats(1, 0)).toBe(1);
    expect(getRemainingSeats(1, 2)).toBe(0);
    expect(getRemainingSeats(null, 1000)).toBeNull();
    expect(canReserveSeat(1, 0)).toBe(true);
    expect(canReserveSeat(1, 1)).toBe(false);
  });
});

describe("refund validation", () => {
  it("requires a positive amount and an idempotency key", () => {
    const result = refundFormSchema.safeParse({ bookingId: "00000000-0000-0000-0000-000000000000", amount: 0, reason: "", idempotencyKey: "00000000-0000-0000-0000-000000000000" });
    expect(result.success).toBe(false);
  });
});

describe("authorization policy", () => {
  it("uses deny-by-default role and ownership checks", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("CUSTOMER")).toBe(false);
    expect(ownsBooking("user-a", "user-a")).toBe(true);
    expect(ownsBooking("user-a", "user-b")).toBe(false);
  });
});

describe("trust-boundary helpers", () => {
  it("formats minor-unit prices with an explicit currency", () => {
    expect(formatMoney(19500, "AUD")).toContain("AUD");
    expect(formatMoney(19500, "AUD")).toContain("195.00");
  });

  it("rejects external post-login destinations and unsafe server errors", () => {
    expect(safeInternalPath("/admin")).toBe("/admin");
    expect(safeInternalPath("https://example.com/account")).toBe("/account");
    expect(publicErrorMessage(new Error("duplicate key violates postgres constraint"), "Try again.")).toBe("Try again.");
  });
});
