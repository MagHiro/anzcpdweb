import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/server/media/private-resources", () => ({ readPrivatePdf: mocks.read }));
import { materialAttachments, MAX_MATERIAL_BYTES } from "@/server/email/resource-attachments";
const material = { title: "Class / materials", kind: "MATERIAL", published: true, objectKey: "sample.pdf" };
beforeEach(() => { vi.resetAllMocks(); mocks.read.mockResolvedValue(Buffer.from("%PDF-test")); });
it("attaches published PDFs only with safe filenames", async () => {
  const attachments = await materialAttachments([material, { ...material, published: false }, { ...material, kind: "RECORDING" }]);
  expect(attachments).toEqual([{ filename: "1-Class  materials.pdf", content: Buffer.from("%PDF-test"), contentType: "application/pdf" }]);
});
it("refuses missing or invalid PDFs rather than sending without attachments", async () => {
  await expect(materialAttachments([])).rejects.toThrow();
  await expect(materialAttachments([{ ...material, objectKey: null }])).rejects.toThrow();
  mocks.read.mockRejectedValue(new Error("Missing file"));
  await expect(materialAttachments([material])).rejects.toThrow();
  mocks.read.mockResolvedValue(Buffer.from("not PDF"));
  await expect(materialAttachments([material])).rejects.toThrow();
});
it("enforces combined attachment size", async () => {
  const bytes = Buffer.alloc(MAX_MATERIAL_BYTES + 1); bytes.write("%PDF-");
  mocks.read.mockResolvedValue(bytes);
  await expect(materialAttachments([material])).rejects.toThrow("18 MB");
});
