import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ origin: vi.fn(), admin: vi.fn(), limit: vi.fn(), create: vi.fn(), activity: vi.fn() }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.origin }));
vi.mock("@/server/auth/admin-request", () => ({ requestAdmin: mocks.admin }));
vi.mock("@/server/security/rate-limit", () => ({ consumeRateLimit: mocks.limit }));
vi.mock("@/server/bookings/service", () => ({ createBookingCheckout: mocks.create }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: mocks.activity }) }) }) }) }));
import { POST } from "@/app/api/admin/participants/route";
const data = { classId: "12345678-1234-4234-8234-123456789012", requestId: "12345678-1234-4234-8234-123456789013", fullName: "Participant", email: "PERSON@example.com", mode: "LINK", policiesConfirmed: true };
const request = (body = {}) => new Request("https://example.com/api/admin/participants", { method: "POST", body: JSON.stringify({ ...data, ...body }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.origin.mockReturnValue(true); mocks.admin.mockResolvedValue({ id: "admin" }); mocks.limit.mockResolvedValue(true); mocks.activity.mockResolvedValue([{ slug: "class" }]);
  mocks.create.mockResolvedValue({ booking: { id: "booking", status: "PENDING_PAYMENT", seatReservationExpiresAt: new Date() }, checkoutUrl: "https://checkout.stripe.com/example" });
});
it("requires same-origin admin access", async () => {
  mocks.origin.mockReturnValue(false); expect((await POST(request())).status).toBe(403);
  mocks.origin.mockReturnValue(true); mocks.admin.mockResolvedValue(null); expect((await POST(request())).status).toBe(403);
  expect(mocks.create).not.toHaveBeenCalled();
});
it("requires policy acknowledgement", async () => {
  expect((await POST(request({ policiesConfirmed: false }))).status).toBe(400);
  expect(mocks.create).not.toHaveBeenCalled();
});
it("creates a copyable checkout link with normalized identity and scoped retry key", async () => {
  const response = await POST(request());
  expect((await response.json()).paymentUrl).toContain("checkout.stripe.com");
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ email: "person@example.com", idempotencyKey: `admin:admin:${data.classId}:LINK:${data.requestId}` }), { actorId: "admin", mode: "LINK", reference: undefined });
});
it("confirms verified payments without returning a payment URL", async () => {
  mocks.create.mockResolvedValue({ booking: { id: "booking", status: "CONFIRMED", seatReservationExpiresAt: null }, checkoutUrl: "/account/bookings/booking" });
  const response = await POST(request({ mode: "VERIFIED", reference: "Bank transfer 123" }));
  expect(await response.json()).toMatchObject({ confirmed: true, paymentUrl: null });
  expect(mocks.create.mock.calls[0][1]).toEqual({ actorId: "admin", mode: "VERIFIED", reference: "Bank transfer 123" });
});
it("accepts verified payments without a payment reference", async () => {
  expect((await POST(request({ mode: "VERIFIED" }))).status).toBe(200);
  expect(mocks.create.mock.calls[0][1]).toEqual({ actorId: "admin", mode: "VERIFIED", reference: undefined });
});
it("enforces rate limits and reports booking conflicts", async () => {
  mocks.limit.mockResolvedValue(false); expect((await POST(request())).status).toBe(429);
  mocks.limit.mockResolvedValue(true); mocks.create.mockRejectedValue(new Error("This participant already has an active booking."));
  expect(await (await POST(request())).json()).toEqual({ error: "This participant already has an active booking." });
});
