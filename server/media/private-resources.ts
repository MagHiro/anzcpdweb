import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const root = path.join(process.cwd(), "private", "resources");
function filePath(key: string) {
  if (!/^[a-f0-9-]{36}\.pdf$/.test(key)) throw new Error("Invalid resource key.");
  return path.join(root, key);
}
export async function storePrivatePdf(file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024 || file.type !== "application/pdf") throw new Error("Upload a PDF of 5 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("The file is not a PDF.");
  const key = `${randomUUID()}.pdf`;
  await mkdir(root, { recursive: true });
  await writeFile(filePath(key), bytes, { flag: "wx", mode: 0o600 });
  return key;
}
export function readPrivatePdf(key: string) { return readFile(filePath(key)); }
export function deletePrivatePdf(key: string) { return unlink(filePath(key)); }
