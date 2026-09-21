import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const allowed = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]);
const assetsRoot = path.join(process.cwd(), "public", "assets");
const assetKeyPattern = /^classes\/[a-z0-9-]+\/[a-z0-9-]+\.(png|jpg|webp)$/;

export function validateImage(file: File): { ok: true; extension: string } | { ok: false; error: string } {
  if (!allowed.has(file.type)) return { ok: false, error: "Upload a PNG, JPEG or WebP image." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Images must be 5 MB or smaller." };
  return { ok: true, extension: allowed.get(file.type) ?? "bin" };
}

function assetPath(objectKey: string) {
  const safeKey = objectKey.replaceAll("\\", "/");
  if (safeKey.includes("..") || safeKey.startsWith("/") || !assetKeyPattern.test(safeKey)) throw new Error("Invalid media key.");
  return path.join(assetsRoot, safeKey);
}

export async function storeImage(input: { classId: string; file: File; extension: string }): Promise<{ objectKey: string; byteSize: number; mimeType: string; originalFilename: string }> {
  const objectKey = `classes/${input.classId}/${randomUUID()}.${input.extension}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  // Magic-byte checks prevent a renamed non-image from reaching storage.
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isPng && !isJpeg && !isWebp) throw new Error("The file content does not match a supported image type.");
  const destination = assetPath(objectKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes, { flag: "wx" });
  return { objectKey, byteSize: bytes.byteLength, mimeType: input.file.type, originalFilename: input.file.name.slice(0, 180) };
}
