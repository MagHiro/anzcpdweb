import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn(), size: vi.fn() }));
vi.mock("@/server/media/private-resources", () => ({ readPrivatePdf: mocks.read }));
vi.mock("@/server/media/private-recordings", () => ({ recordingSize: mocks.size }));
import { resourceReadiness } from "@/server/email/resource-readiness";
const material = { kind: "MATERIAL", published: true, objectKey: "sample.pdf", recordingUrl: null };
const recording = { kind: "RECORDING", published: true, objectKey: null, recordingUrl: "https://example.com/video" };
beforeEach(() => { vi.resetAllMocks(); mocks.read.mockResolvedValue(Buffer.from("%PDF-test")); });
it("accepts published available PDFs and HTTPS recordings", async () => {
  expect(await resourceReadiness([material, recording])).toEqual({ materials: true, recording: true });
});
it("excludes drafts, absent files and invalid recordings", async () => {
  mocks.read.mockRejectedValue(new Error("Missing"));
  expect(await resourceReadiness([material, { ...recording, published: false }, { ...recording, recordingUrl: "http://example.com/video" }, { ...recording, recordingUrl: "https://user:pass@example.com" }])).toEqual({ materials: false, recording: false });
});
it("rejects missing resource references and non-PDF content", async () => {
  mocks.read.mockResolvedValue(Buffer.from("not a pdf"));
  expect(await resourceReadiness([material, { ...material, objectKey: null }, { ...recording, recordingUrl: null }])).toEqual({ materials: false, recording: false });
});
it("requires a completed published upload for recording emails", async () => {
  const uploaded = { ...recording, recordingUrl: null, objectKey: "video.mp4" };
  mocks.size.mockResolvedValue(100);
  expect(await resourceReadiness([uploaded])).toEqual({ materials: false, recording: true });
  expect(await resourceReadiness([{ ...uploaded, published: false }])).toEqual({ materials: false, recording: false });
  mocks.size.mockRejectedValue(new Error("Incomplete"));
  expect(await resourceReadiness([uploaded])).toEqual({ materials: false, recording: false });
});
