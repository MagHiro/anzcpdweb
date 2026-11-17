import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ origin: vi.fn(), admin: vi.fn(), limit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.origin }));
vi.mock("@/server/auth/admin-request", () => ({ requestAdmin: mocks.admin }));
vi.mock("@/server/security/rate-limit", () => ({ consumeRateLimit: mocks.limit }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ transaction: mocks.transaction }) }));
import { POST } from "@/app/api/admin/class-email/route";

const data = { classId: "12345678-1234-4234-8234-123456789012", campaignId: "12345678-1234-4234-8234-123456789013", subject: "Update", message: "Class information" };
const request = (body: unknown = data) => new Request("https://example.com/api/admin/class-email", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); mocks.origin.mockReturnValue(true); mocks.admin.mockResolvedValue({ id: "admin" }); mocks.limit.mockResolvedValue(true); });
it("rejects foreign origins and non-admin users before queueing", async () => {
  mocks.origin.mockReturnValue(false);
  expect((await POST(request())).status).toBe(403);
  mocks.origin.mockReturnValue(true); mocks.admin.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(403);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("rejects invalid requests and rate limited sends", async () => {
  expect((await POST(request({ ...data, subject: " " }))).status).toBe(400);
  mocks.limit.mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("queues each unique recipient and audit record atomically", async () => {
  const inserts: unknown[] = [];
  const results = [[{ title: "Class" }], [], [{ email: "a@example.com", fullName: "Alex A" }, { email: "A@example.com", fullName: "Alex A" }]];
  mocks.transaction.mockImplementation(async callback => {
    const chain = { from: () => chain, where: () => chain, for: () => chain, limit: () => Promise.resolve(results.shift()), then: (resolve: (value: unknown) => unknown) => Promise.resolve(results.shift()).then(resolve) };
    return callback({ select: () => chain, insert: () => ({ values: async (value: unknown) => { inserts.push(value); } }) });
  });
  const response = await POST(request());
  expect(await response.json()).toEqual({ success: true, count: 1 });
  expect(inserts).toHaveLength(2);
  expect(inserts[0]).toEqual([expect.objectContaining({ recipientEmail: "a@example.com", messageType: "CLASS_EMAIL" })]);
});
it("returns the original count for a retry without queueing again", async () => {
  mocks.transaction.mockImplementation(async callback => {
    const results = [[{ title: "Class" }], [{ id: data.campaignId, actorUserId: "admin", action: "CLASS_EMAIL_QUEUED", entityId: data.classId, metadata: { ...data, count: 7 } }]];
    const chain = { from: () => chain, where: () => chain, for: () => chain, limit: () => Promise.resolve(results.shift()) };
    return callback({ select: () => chain });
  });
  expect(await (await POST(request())).json()).toEqual({ success: true, count: 7 });
});
it("returns a retryable error on transaction failure", async () => {
  mocks.transaction.mockRejectedValue(new Error("DB failure"));
  expect((await POST(request())).status).toBe(500);
});
