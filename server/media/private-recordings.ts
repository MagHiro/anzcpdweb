import { mkdir, open, rename, stat, unlink, rmdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";

export const MAX_RECORDING_BYTES = 2 * 1024 * 1024 * 1024;
export const RECORDING_CHUNK_BYTES = 8 * 1024 * 1024;
const root = path.join(process.cwd(), "private", "resources");
function recordingPath(key: string) {
  if (!/^[a-f0-9-]{36}\.mp4$/.test(key)) throw new Error("Invalid recording key.");
  return path.join(root, key);
}
export async function recordingSize(key: string) {
  const info = await stat(recordingPath(key));
  if (!info.isFile() || !info.size || info.size > MAX_RECORDING_BYTES) throw new Error("Recording unavailable.");
  return info.size;
}
export async function appendRecordingChunk(key: string, offset: number, total: number, bytes: Buffer) {
  const target = recordingPath(key);
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(total) || offset < 0 || total < 12 || total > MAX_RECORDING_BYTES || !bytes.length || bytes.length > RECORDING_CHUNK_BYTES || offset + bytes.length > total) throw new Error("Invalid recording chunk or size (maximum 2 GB).");
  if (offset === 0 && bytes.subarray(4, 8).toString() !== "ftyp") throw new Error("Upload an MP4 video.");
  await mkdir(root, { recursive: true });
  const lock = `${target}.lock`;
  await mkdir(lock);
  try {
    if (await stat(target).then(() => true, () => false)) throw new Error("Recording has already been uploaded.");
    const file = await open(`${target}.upload`, "a", 0o600);
    try {
      if ((await file.stat()).size !== offset) throw new Error("Upload position changed. Remove this draft and upload again.");
      await file.writeFile(bytes);
    } finally { await file.close(); }
    const complete = offset + bytes.length === total;
    if (complete) await rename(`${target}.upload`, target);
    return complete;
  } finally { await rmdir(lock); }
}
export async function deletePrivateRecording(key: string) {
  const target = recordingPath(key);
  await Promise.all([target, `${target}.upload`].map(file => unlink(file).catch(error => { if (error.code !== "ENOENT") throw error; })));
}
export function recordingRange(range: string | null, size: number) {
  if (!range) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return null;
  return { start, end, partial: true };
}
export function streamRecording(key: string, start: number, end: number) {
  return Readable.toWeb(createReadStream(recordingPath(key), { start, end })) as ReadableStream<Uint8Array>;
}
