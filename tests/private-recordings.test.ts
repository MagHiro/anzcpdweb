import { randomUUID } from "node:crypto";
import { afterEach, expect, it } from "vitest";
import { appendRecordingChunk, deletePrivateRecording, recordingRange, recordingSize, streamRecording, MAX_RECORDING_BYTES } from "@/server/media/private-recordings";

const keys: string[] = [];
const key = () => { const value = `${randomUUID()}.mp4`; keys.push(value); return value; };
afterEach(async () => { await Promise.all(keys.splice(0).map(deletePrivateRecording)); });
it("stores chunks privately and streams requested bytes only after completion", async () => {
  const id = key();
  const first = Buffer.from([0, 0, 0, 20, ...Buffer.from("ftypisom")]);
  expect(await appendRecordingChunk(id, 0, 20, first)).toBe(false);
  await expect(recordingSize(id)).rejects.toThrow();
  await expect(appendRecordingChunk(id, 0, 20, first)).rejects.toThrow("position");
  expect(await appendRecordingChunk(id, 12, 20, Buffer.from("12345678"))).toBe(true);
  expect(await recordingSize(id)).toBe(20);
  expect(await new Response(streamRecording(id, 12, 15)).text()).toBe("1234");
  await expect(appendRecordingChunk(id, 0, 20, first)).rejects.toThrow("already");
});
it("rejects non-MP4 files, oversized files, invalid positions and path traversal", async () => {
  await expect(appendRecordingChunk(key(), 0, 20, Buffer.from("not a video!"))).rejects.toThrow("MP4");
  await expect(appendRecordingChunk(key(), 0, MAX_RECORDING_BYTES + 1, Buffer.from("0000ftypisom"))).rejects.toThrow("size");
  await expect(appendRecordingChunk(key(), -1, 20, Buffer.from("0000ftypisom"))).rejects.toThrow();
  await expect(recordingSize("../../secret.mp4")).rejects.toThrow("key");
});
it("supports normal, open-ended and suffix ranges, rejecting malformed and unsatisfiable ranges", () => {
  expect(recordingRange(null, 100)).toEqual({ start: 0, end: 99, partial: false });
  expect(recordingRange("bytes=10-19", 100)).toEqual({ start: 10, end: 19, partial: true });
  expect(recordingRange("bytes=90-", 100)).toEqual({ start: 90, end: 99, partial: true });
  expect(recordingRange("bytes=-10", 100)).toEqual({ start: 90, end: 99, partial: true });
  expect(recordingRange("bytes=0-999", 100)).toEqual({ start: 0, end: 99, partial: true });
  for (const range of ["bytes=-0", "bytes=100-", "bytes=20-10", "bytes=-", "bytes=0-1,2-3", "bad", "bytes=999999999999999999999-"]) expect(recordingRange(range, 100)).toBeNull();
});
