import { readPrivatePdf } from "@/server/media/private-resources";

export async function resourceReadiness(resources: { kind: string; published: boolean; objectKey: string | null; recordingUrl: string | null }[]) {
  let materials = false;
  let recording = false;
  for (const resource of resources) {
    if (!resource.published) continue;
    if (resource.kind === "MATERIAL" && resource.objectKey) {
      try { const bytes = await readPrivatePdf(resource.objectKey); if (bytes.subarray(0, 5).toString() === "%PDF-") materials = true; } catch { /* Missing files are not ready to share. */ }
    }
    if (resource.kind === "RECORDING" && resource.recordingUrl) {
      try { const url = new URL(resource.recordingUrl); if (url.protocol === "https:" && !url.username && !url.password) recording = true; } catch { /* Invalid links are not ready to share. */ }
    }
  }
  return { materials, recording };
}
