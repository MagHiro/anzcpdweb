import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ select: vi.fn(), insert: vi.fn(), receipt: vi.fn(), queue: vi.fn(), stripe: vi.fn(), token: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ select: mocks.select, transaction: mocks.transaction }) }));
vi.mock("@/server/payments/receipts", () => ({ enqueuePaymentReceipt: mocks.receipt }));
vi.mock("@/server/email/service", () => ({ queueEmail: mocks.queue }));
vi.mock("@/server/auth/tokens", () => ({ createAccountToken: mocks.token }));
vi.mock("@/server/payments/stripe", () => ({ getStripe: mocks.stripe }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ APP_URL: "https://example.com" }) }));
import { createBookingCheckout } from "@/server/bookings/service";
import { auditLogs, bookings, payments } from "@/db/schema";

const input = { classSlug: "class", fullName: "Person", email: "person@example.com", createAccountRequested: true, termsAcceptedAt: new Date(), refundPolicyAcceptedAt: new Date(), idempotencyKey: "admin-key" };
const activity = { id: "class", slug: "class", status: "COMPLETED", country: "NZ", priceMinorUnits: 15000, currency: "NZD", title: "Class", timezone: "Pacific/Auckland", unlimitedCapacity: true, professionalIdentifierRequired: false };
const inserted: { table: unknown; values: Record<string, unknown> }[] = [];
let results: unknown[][];
function query() {
  const result = results.shift() ?? [];
  const chain = { from: () => chain, where: () => chain, for: () => chain, limit: async () => result, then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(result).then(resolve) };
  return chain;
}
beforeEach(() => {
  vi.resetAllMocks(); inserted.length = 0;
  // Account lookup, idempotency lookup, locked class, retry lookup, duplicate,
  // capacity refresh, confirmation dedupe, confirmation class details.
  results = [[{ id: "user" }], [], [activity], [], [], [activity], [], [{ startAt: new Date(), meetingLink: null }]];
  mocks.select.mockImplementation(query);
  mocks.insert.mockImplementation(table => ({ values: (values: Record<string, unknown>) => {
    inserted.push({ table, values });
    return { returning: async () => [{ id: "booking", ...values }] };
  } }));
  mocks.transaction.mockImplementation(async fn => fn({ select: mocks.select, insert: mocks.insert }));
});
it("records verified payments, account ownership, and admin evidence without contacting Stripe", async () => {
  const result = await createBookingCheckout(input, { actorId: "admin", mode: "VERIFIED", reference: "Transfer 123" });
  expect(result.booking.status).toBe("CONFIRMED");
  expect(inserted.find(item => item.table === bookings)?.values).toMatchObject({ userId: "user", status: "CONFIRMED", paidAt: expect.any(Date), seatReservationExpiresAt: null, createAccountRequested: false });
  expect(inserted.find(item => item.table === payments)?.values).toMatchObject({ status: "SUCCEEDED", amountCaptured: 15000 });
  expect(inserted.find(item => item.table === auditLogs)?.values).toMatchObject({ actorUserId: "admin", action: "ADMIN_PAYMENT_VERIFIED", metadata: expect.objectContaining({ reference: "Transfer 123" }) });
  expect(mocks.receipt).toHaveBeenCalledWith("booking");
  expect(mocks.queue).toHaveBeenCalled(); expect(mocks.stripe).not.toHaveBeenCalled();
});
it("rejects duplicate active participants before creating records", async () => {
  results[4] = [{ id: "duplicate" }];
  await expect(createBookingCheckout(input, { actorId: "admin", mode: "VERIFIED", reference: "Transfer" })).rejects.toThrow("active booking");
  expect(inserted).toHaveLength(0);
});
it("confirms verified payments without a payment reference while retaining the audit record", async () => {
  const result = await createBookingCheckout(input, { actorId: "admin", mode: "VERIFIED" });
  expect(result.booking.status).toBe("CONFIRMED");
  expect(inserted.find(item => item.table === auditLogs)?.values).toMatchObject({ actorUserId: "admin", action: "ADMIN_PAYMENT_VERIFIED" });
});
it("enforces capacity even for verified payments", async () => {
  results[2] = [{ ...activity, unlimitedCapacity: false, seatCapacity: 1 }];
  results[5] = [{ count: 1 }];
  await expect(createBookingCheckout(input, { actorId: "admin", mode: "VERIFIED", reference: "Transfer" })).rejects.toThrow("sold out");
  expect(inserted).toHaveLength(0);
});
