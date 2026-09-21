import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const allowed = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]);

export function validateImage(file: File): { ok: true; extension: string } | { ok: false; error: string } {
  if (!allowed.has(file.type)) return { ok: false, error: "Upload a PNG, JPEG or WebP image." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Images must be 5 MB or smaller." };
  return { ok: true, extension: allowed.get(file.type) ?? "bin" };
}

async function hasR2Configuration() {
  const env = getServerEnv();
  return Boolean(env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}

function r2Client() {
  const env = getServerEnv();
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) throw new Error("R2 storage is not configured.");
  return new S3Client({ region: "auto", endpoint: env.R2_ENDPOINT, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
}

export async function storeImage(input: { classId: string; file: File; extension: string }): Promise<{ objectKey: string; byteSize: number; mimeType: string; originalFilename: string }> {
  const env = getServerEnv();
  const objectKey = `classes/${input.classId}/${randomUUID()}.${input.extension}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  // Magic-byte checks prevent a renamed non-image from reaching storage.
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isPng && !isJpeg && !isWebp) throw new Error("The file content does not match a supported image type.");
  if (await hasR2Configuration()) {
    await r2Client().send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: objectKey, Body: bytes, ContentType: input.file.type, ContentLength: bytes.byteLength, CacheControl: "public, max-age=31536000, immutable" }));
  } else {
    if (env.NODE_ENV === "production") throw new Error("R2 storage is not configured.");
    const localRoot = path.join(process.cwd(), "data", "uploads");
    await mkdir(path.join(localRoot, path.dirname(objectKey)), { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path.join(localRoot, objectKey), bytes, { flag: "wx" });
  }
  return { objectKey, byteSize: bytes.byteLength, mimeType: input.file.type, originalFilename: input.file.name.slice(0, 180) };
}

export async function getStoredImage(objectKey: string): Promise<{ redirectUrl?: string; bytes?: Uint8Array; contentType?: string }> {
  const safeKey = objectKey.replaceAll("\\", "/");
  if (safeKey.includes("..") || safeKey.startsWith("/") || !/^classes\/[a-z0-9-]+\/[a-z0-9-]+\.(png|jpg|webp)$/.test(safeKey)) throw new Error("Invalid media key.");
  if (await hasR2Configuration()) {
    const env = getServerEnv();
    if (env.R2_PUBLIC_BASE_URL) return { redirectUrl: `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${safeKey}` };
    const response = await r2Client().send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: safeKey }));
    const chunks: Uint8Array[] = [];
    if (response.Body) for await (const chunk of response.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    return { bytes: Buffer.concat(chunks), contentType: response.ContentType ?? "application/octet-stream" };
  }
  const bytes = await readFile(path.join(process.cwd(), "data", "uploads", safeKey));
  const contentType = safeKey.endsWith(".png") ? "image/png" : safeKey.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return { bytes, contentType };
}
