import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ origin: vi.fn(), admin: vi.fn(), resource: vi.fn(), append: vi.fn() }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.origin }));
vi.mock("@/server/auth/admin-request", () => ({ requestAdmin: mocks.admin }));
vi.mock("@/server/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ select: () => ({ from: () => ({ where: mocks.resource }) }) }) }));
vi.mock("@/server/media/private-recordings", () => ({ appendRecordingChunk: mocks.append, RECORDING_CHUNK_BYTES: 8 * 1024 * 1024 }));
import { PUT } from "@/app/api/admin/recordings/route";
const id = "12345678-1234-4234-8234-123456789012";
function request(extra: Record<string, string> = {}) { return new Request(`https://example.com/api/admin/recordings?id=${id}`, { method: "PUT", headers: { "x-upload-offset": "0", "x-upload-total": "12", ...extra }, body: "0000ftypisom" }); }
beforeEach(() => { vi.resetAllMocks(); mocks.origin.mockReturnValue(true); mocks.admin.mockResolvedValue({ id: "admin" }); mocks.resource.mockResolvedValue([{ kind: "RECORDING", objectKey: `${id}.mp4`, published: false }]); mocks.append.mockResolvedValue(true); });
it("requires same-origin administrator requests", async () => {
  mocks.origin.mockReturnValue(false); expect((await PUT(request())).status).toBe(403);
  mocks.origin.mockReturnValue(true); mocks.admin.mockResolvedValue(null); expect((await PUT(request())).status).toBe(403);
  expect(mocks.append).not.toHaveBeenCalled();
});
it("writes bounded chunks to an existing unpublished recording only", async () => {
  expect(await (await PUT(request())).json()).toEqual({ complete: true });
  expect(mocks.append).toHaveBeenCalledWith(`${id}.mp4`, 0, 12, Buffer.from("0000ftypisom"));
  mocks.resource.mockResolvedValue([{ kind: "RECORDING", objectKey: `${id}.mp4`, published: true }]);
  expect((await PUT(request())).status).toBe(404);
});
it("rejects oversized chunks and reports storage validation errors", async () => {
  expect((await PUT(request({ "content-length": "99999999" }))).status).toBe(413);
  mocks.append.mockRejectedValue(new Error("Invalid MP4"));
  const response = await PUT(request());
  expect(response.status).toBe(400); expect(await response.json()).toEqual({ error: "Invalid MP4" });
});
