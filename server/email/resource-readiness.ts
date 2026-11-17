import { readPrivatePdf } from "@/server/media/private-resources";
import { MAX_MATERIAL_BYTES } from "./resource-attachments";

export async function resourceReadiness(resources: { kind: string; published: boolean; objectKey: string | null; recordingUrl: string | null }[]) {
  let materials = false;
  let recording = false;
  let invalidMaterial = false;
  let totalBytes = 0;
  for (const resource of resources) {
    if (!resource.published) continue;
    if (resource.kind === "MATERIAL") {
      try { if (!resource.objectKey) throw new Error("Missing PDF"); const bytes = await readPrivatePdf(resource.objectKey); totalBytes += bytes.length; if (bytes.subarray(0, 5).toString() === "%PDF-") materials = true; else invalidMaterial = true; } catch { invalidMaterial = true; }
    }
    if (resource.kind === "RECORDING" && resource.recordingUrl) {
      try { const url = new URL(resource.recordingUrl); if (url.protocol === "https:" && !url.username && !url.password) recording = true; } catch { /* Invalid links are not ready to share. */ }
    }
  }
  return { materials: materials && !invalidMaterial && totalBytes <= MAX_MATERIAL_BYTES, recording };
}
