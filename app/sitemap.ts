import type { MetadataRoute } from "next";
import { getPresenters, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  let classes: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  try { classes = await getPublishedClasses({ time: "upcoming", pageSize: 50 }); } catch { classes = []; }
  let presenters: Awaited<ReturnType<typeof getPresenters>> = [];
  try { presenters = await getPresenters(); } catch { presenters = []; }
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "daily", priority: .9 },
    { url: `${base}/cpd-requirements`, changeFrequency: "monthly", priority: .8 },
    { url: `${base}/presenters`, changeFrequency: "monthly", priority: .7 },
    { url: `${base}/classes`, changeFrequency: "daily", priority: .9 },
    { url: `${base}/australia`, changeFrequency: "weekly", priority: .7 },
    { url: `${base}/new-zealand`, changeFrequency: "weekly", priority: .7 },
    ...presenters.map((item) => ({ url: `${base}/presenters/${item.slug}`, changeFrequency: "monthly" as const, priority: .6 })),
    ...classes.map((item) => ({ url: `${base}/classes/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: .8 })),
  ];
}
