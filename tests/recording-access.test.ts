import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), admin: vi.fn(), access: vi.fn(), resource: vi.fn(), size: vi.fn(), stream: vi.fn() }));
vi.mock("@/server/auth/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/server/auth/admin-request", () => ({ requestAdmin: mocks.admin }));
vi.mock("@/server/bookings/resources", () => ({ participantHasResourceAccess: mocks.access }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ select: () => ({ from: () => ({ where: mocks.resource }) }) }) }));
vi.mock("@/server/media/private-recordings", async importOriginal => ({ ...await importOriginal<typeof import("@/server/media/private-recordings")>(), recordingSize: mocks.size, streamRecording: mocks.stream }));
import { GET } from "@/app/api/class-resources/[id]/route";
const id = "12345678-1234-4234-8234-123456789012";
const resource = { id, classId: "class", kind: "RECORDING", published: true, objectKey: `${id}.mp4` };
const get = (range?: string) => GET(new Request(`https://example.com/api/class-resources/${id}`, { headers: range ? { range } : {} }), { params: Promise.resolve({ id }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.session.mockResolvedValue({ user: { id: "user" } }); mocks.resource.mockResolvedValue([resource]); mocks.access.mockResolvedValue(true); mocks.size.mockResolvedValue(100); mocks.stream.mockImplementation(() => new ReadableStream({ start(controller) { controller.close(); } }));
});
it("requires authentication and an eligible booking on every request", async () => {
  mocks.session.mockResolvedValue(null); expect((await get()).status).toBe(401);
  mocks.session.mockResolvedValue({ user: { id: "user" } }); mocks.access.mockResolvedValue(false);
  expect((await get("bytes=0-9")).status).toBe(404);
  expect(mocks.stream).not.toHaveBeenCalled();
});
it("hides drafts from participants but allows admin preview", async () => {
  mocks.resource.mockResolvedValue([{ ...resource, published: false }]);
  expect((await get()).status).toBe(404);
  mocks.admin.mockResolvedValue({ id: "admin" });
  expect((await get()).status).toBe(200);
});
it("streams seekable video without public URLs or caching", async () => {
  const response = await get("bytes=10-19");
  expect(response.status).toBe(206);
  expect(response.headers.get("content-range")).toBe("bytes 10-19/100");
  expect(response.headers.get("content-length")).toBe("10");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("content-type")).toBe("video/mp4");
  expect(response.headers.get("content-disposition")).toBe("inline");
  expect(mocks.stream).toHaveBeenCalledWith(resource.objectKey, 10, 19);
});
it("rejects invalid ranges and handles unavailable recordings", async () => {
  expect((await get("bytes=100-")).status).toBe(416);
  mocks.size.mockRejectedValue(new Error("Missing"));
  expect((await get()).status).toBe(503);
});
