import { readPrivatePdf } from "@/server/media/private-resources";

export const MAX_MATERIAL_BYTES = 18 * 1024 * 1024;
export async function materialAttachments(resources: { title: string; kind: string; published: boolean; objectKey: string | null }[]) {
  const materials = resources.filter(resource => resource.published && resource.kind === "MATERIAL");
  if (!materials.length) throw new Error("Publish materials before sending this template.");
  let total = 0;
  return Promise.all(materials.map(async (resource, index) => {
    if (!resource.objectKey) throw new Error("A published material is missing its PDF.");
    const content = await readPrivatePdf(resource.objectKey);
    if (content.subarray(0, 5).toString() !== "%PDF-") throw new Error("A published material is not a valid PDF.");
    total += content.length;
    if (total > MAX_MATERIAL_BYTES) throw new Error("Materials exceed the 18 MB combined attachment limit.");
    const title = resource.title.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 100) || "Material";
    return { filename: `${index + 1}-${title}.pdf`, content, contentType: "application/pdf" };
  }));
}
