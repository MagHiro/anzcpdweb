import { redirect } from "next/navigation";
export default async function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (typeof value === "string") query.set(key, key === "country" ? ({ Australia: "AU", "New Zealand": "NZ" }[value] ?? value) : value);
  redirect(`/classes${query.size ? `?${query}` : ""}`);
}
