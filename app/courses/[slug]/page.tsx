import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedClassBySlug } from "@/server/catalogue/queries";
import { slugSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getClass(slug: string) {
  if (!slugSchema.safeParse(slug).success) return null;
  return getPublishedClassBySlug(slug).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const record = await getClass(slug);
  return record ? { title: record.seoTitle ?? record.title, description: record.seoDescription ?? record.shortDescription } : { title: "Activity not found" };
}

export default async function CourseDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const record = await getClass(slug);
  if (!record) notFound();
  redirect(`/classes/${record.slug}`);
}
