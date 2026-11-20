import { expect, it } from "vitest";
import { resourceResponse } from "@/lib/http-response";
import { RECORDING_CHUNK_BYTES } from "@/server/media/private-recordings";

it("keeps recording chunks below the production 7 MB request limit", () => {
  expect(RECORDING_CHUNK_BYTES).toBe(4 * 1024 * 1024);
  expect(RECORDING_CHUNK_BYTES).toBeLessThan(7340032);
});
it("replaces HTML proxy errors with actionable upload feedback", async () => {
  await expect(resourceResponse(new Response("<!DOCTYPE html>Too large", { status: 413 }))).rejects.toThrow("upload size");
  await expect(resourceResponse(new Response("<html>Bad gateway", { status: 502 }))).rejects.toThrow("502");
  expect(await resourceResponse(Response.json({ error: "Sign in required" }, { status: 401 }))).toEqual({ error: "Sign in required" });
});
