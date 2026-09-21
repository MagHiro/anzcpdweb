import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { Reveal } from "@/components/animations";
import { ClassCard, Container, EmptyState, Pagination, Section, Select, TextInput } from "@/components/ui";
import type { CountryCode } from "@/db/schema";
import { getCategories, getCountries, getPublishedActivityTypes, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string; type?: string; country?: string; q?: string; page?: string }>;

function addQuery(path: string, values: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) query.set(key, value);
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedCountry = params.country;
  let countries: Awaited<ReturnType<typeof getCountries>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let activityTypes: Awaited<ReturnType<typeof getPublishedActivityTypes>> = [];
  let classes: Awaited<ReturnType<typeof getPublishedClasses>> = [];

  try {
    countries = await getCountries();
    const countryRecord = countries.find((item) => item.code === requestedCountry || item.name === requestedCountry);
    const country = countryRecord?.code as CountryCode | undefined;
    [categories, activityTypes] = await Promise.all([
      getCategories(country),
      getPublishedActivityTypes(country),
    ]);
    const categorySlug = categories.some((item) => item.slug === params.category) ? params.category : undefined;
    const activityType = activityTypes.some((item) => item.value === params.type) ? params.type : undefined;
    classes = await getPublishedClasses({
      country,
      categorySlug,
      activityType,
      search: params.q?.trim() || undefined,
      time: "upcoming",
      page: Math.max(Number(params.page) || 1, 1),
      pageSize: 12,
    });
  } catch {
    countries = [];
    categories = [];
    activityTypes = [];
    classes = [];
  }

  const selectedCountry = countries.find((item) => item.code === requestedCountry || item.name === requestedCountry)?.code as CountryCode | undefined;
  const selectedCategory = categories.some((item) => item.slug === params.category) ? params.category : undefined;
  const selectedType = activityTypes.some((item) => item.value === params.type) ? params.type : undefined;
  const page = Math.max(Number(params.page) || 1, 1);
  const search = params.q?.trim() || undefined;
  const currentFilters = { country: selectedCountry, category: selectedCategory, type: selectedType, q: search };
  const hrefFor = (changes: Record<string, string | undefined>) => addQuery("/courses", { ...currentFilters, ...changes });

  return <>
    <section className="bg-[var(--forest)] text-white"><Container className="py-20 sm:py-24"><div className="max-w-4xl"><p className="eyebrow text-[#b9d6c7]">The catalogue</p><h1 className="display mt-5 text-5xl leading-[.95] sm:text-7xl">Choose the kind of learning you need next.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[#c5d8ce]">Every published class shows its category, format, time, CPD value and presenter before you register. Use the database-backed filters to find a better fit.</p></div><div className="mt-10 flex flex-wrap gap-2 text-xs font-bold"><Link href={hrefFor({ country: undefined, category: undefined, type: undefined, q: undefined })} className={`rounded-full px-4 py-2.5 ${!selectedCountry && !selectedCategory && !selectedType && !search ? "bg-[#e87954] text-white" : "border border-[#6f9588] text-[#dce8e1]"}`}>All activities</Link>{countries.map((country) => <Link key={country.code} href={hrefFor({ country: country.code })} className={`rounded-full px-4 py-2.5 ${selectedCountry === country.code ? "bg-[#e87954] text-white" : "border border-[#6f9588] text-[#dce8e1]"}`}>{country.name}</Link>)}</div></Container></section>
    <Section className="bg-[#fbfaf6]"><Container><form className="grid gap-3 rounded-[1.35rem] border border-[var(--line)] bg-white p-4 md:grid-cols-[1.3fr_1fr_1fr_auto]" method="get"><div><label className="sr-only" htmlFor="q">Search classes</label><TextInput id="q" name="q" placeholder="Search by topic" defaultValue={search} /></div><div><label className="sr-only" htmlFor="category">Category</label><Select id="category" name="category" defaultValue={selectedCategory ?? ""}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</Select></div><div><label className="sr-only" htmlFor="type">Activity type</label><Select id="type" name="type" defaultValue={selectedType ?? ""}><option value="">All activity types</option>{activityTypes.map((activity) => <option key={activity.value} value={activity.value}>{activity.value}</option>)}</Select></div><div className="flex items-center"><button className="focus-ring min-h-11 w-full rounded-xl bg-[var(--forest)] px-5 text-sm font-bold text-white hover:bg-[var(--fern)]" type="submit">Apply filters</button></div><input type="hidden" name="country" value={selectedCountry ?? ""} /></form><div className="mt-8 flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow text-[var(--fern)]">{classes.length} activities shown</p><h2 className="display mt-3 text-4xl text-[var(--forest)] sm:text-5xl">Upcoming CPD</h2></div><Link href="/cpd-requirements" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--forest)] underline decoration-[#e87954] underline-offset-4">Read the catalogue guide <ArrowUpRight size={16} /></Link></div><div className="mt-7 flex flex-wrap gap-2 border-y border-[var(--line)] py-4 text-xs font-semibold"><span className="mr-2 py-2 text-[var(--muted)]">Filter by category:</span>{categories.map((category) => <Link key={category.id} href={hrefFor({ category: category.slug })} className={`rounded-full px-3 py-2 ${selectedCategory === category.slug ? "bg-[var(--forest)] text-white" : "bg-white text-[var(--muted)] hover:text-[var(--forest)]"}`}>{category.name}</Link>)}{selectedCategory || selectedType || selectedCountry || search ? <Link href="/courses" className="ml-auto py-2 font-bold text-[#a7472b] underline underline-offset-4">Clear filters</Link> : null}</div>{classes.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{classes.map((item) => <Reveal key={item.id}><ClassCard item={item} /></Reveal>)}</div> : <div className="mt-8"><EmptyState title="No published classes match those filters." description="Try another category, activity type, country or search term. Published class records will appear here when they are available." action={<Link href="/courses" className="font-bold text-[var(--forest)] underline underline-offset-4">Show all activities</Link>} /></div>}<Pagination page={page} hasNext={classes.length === 12} previousHref={hrefFor({ page: page > 1 ? String(page - 1) : undefined })} nextHref={hrefFor({ page: String(page + 1) })} /></Container></Section>
    <section className="border-y border-[#eadfd2] bg-[#fff8ef]"><Container className="flex flex-wrap items-center justify-between gap-6 py-8"><p className="max-w-2xl text-sm leading-6 text-[#6f5b4e]">Need a date for your team? Contact the academy and we can help you plan around the published catalogue records and the requirements that apply to you.</p><a href="mailto:info@anzmigrationacademy.com" className="focus-ring rounded-full border border-[#b77b3f] px-5 py-3 text-sm font-bold text-[#85551e] hover:bg-[#fbead4]">Contact the academy</a></Container></section>
  </>;
}
