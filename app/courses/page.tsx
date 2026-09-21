import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { Reveal } from "@/components/animations";
import { ClassCard, Container, EmptyState, LinkButton, PageIntro, Pagination, Section, Select, TextInput } from "@/components/ui";
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
    [categories, activityTypes] = await Promise.all([getCategories(country), getPublishedActivityTypes(country)]);
    const categorySlug = categories.some((item) => item.slug === params.category) ? params.category : undefined;
    const activityType = activityTypes.some((item) => item.value === params.type) ? params.type : undefined;
    classes = await getPublishedClasses({ country, categorySlug, activityType, search: params.q?.trim() || undefined, time: "upcoming", page: Math.max(Number(params.page) || 1, 1), pageSize: 12 });
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
    <section className="grain relative overflow-hidden bg-[var(--forest)] text-white"><div className="pointer-events-none absolute inset-0 dot-grid opacity-20" /><Container className="relative py-20 sm:py-24"><PageIntro tone="light" eyebrow="The catalogue" title="Choose the learning you need next." description="Every published activity shows its country, format, time, CPD value and presenter before you register."><div className="flex flex-wrap gap-3"><LinkButton href={hrefFor({ country: undefined, category: undefined, type: undefined, q: undefined })} className="bg-[var(--signal)] text-white hover:bg-[#e88b6d]">All activities</LinkButton>{countries.map((country) => <LinkButton key={country.code} href={hrefFor({ country: country.code })} variant="secondary" className={cnCountry(selectedCountry === country.code)}>{country.name}</LinkButton>)}</div></PageIntro></Container></section>
    <Section className="bg-[var(--paper)]"><Container><form className="surface-grid grid gap-3 rounded-[1.45rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_40px_rgba(18,36,31,.04)] md:grid-cols-[1.3fr_1fr_1fr_auto]" method="get"><div><label className="sr-only" htmlFor="q">Search classes</label><TextInput id="q" name="q" placeholder="Search by topic" defaultValue={search} /></div><div><label className="sr-only" htmlFor="category">Category</label><Select id="category" name="category" defaultValue={selectedCategory ?? ""}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</Select></div><div><label className="sr-only" htmlFor="type">Activity type</label><Select id="type" name="type" defaultValue={selectedType ?? ""}><option value="">All activity types</option>{activityTypes.map((activity) => <option key={activity.value} value={activity.value}>{activity.value}</option>)}</Select></div><div className="flex items-center"><button className="focus-ring min-h-12 w-full rounded-xl bg-[var(--forest)] px-5 text-sm font-bold text-white hover:bg-[var(--fern)]" type="submit">Apply filters</button></div><input type="hidden" name="country" value={selectedCountry ?? ""} /></form><div className="mt-12 flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow text-[var(--fern)]">{classes.length} activities shown</p><h2 className="display mt-3 text-4xl text-[var(--forest)] sm:text-5xl">Upcoming CPD</h2></div><Link href="/cpd-requirements" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-[var(--forest)] underline decoration-[var(--signal)] underline-offset-4">Read the catalogue guide <ArrowUpRight size={16} /></Link></div><div className="mt-7 flex flex-wrap gap-2 border-y border-[var(--line)] py-4 text-xs font-semibold"><span className="mr-2 py-2 text-[var(--muted)]">Filter by category:</span>{categories.map((category) => <Link key={category.id} href={hrefFor({ category: category.slug })} className={`rounded-full px-3 py-2 ${selectedCategory === category.slug ? "bg-[var(--forest)] text-white" : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--forest)]"}`}>{category.name}</Link>)}{selectedCategory || selectedType || selectedCountry || search ? <Link href="/courses" className="ml-auto py-2 font-bold text-[var(--error)] underline underline-offset-4">Clear filters</Link> : null}</div>{classes.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{classes.map((item) => <Reveal key={item.id}><ClassCard item={item} /></Reveal>)}</div> : <div className="mt-8"><EmptyState title="No published activities match those filters." description="Try another country, category, activity type or search term. Published records will appear here when they are available." action={<LinkButton href="/courses" variant="secondary">Show all activities</LinkButton>} /></div>}<Pagination page={page} hasNext={classes.length === 12} previousHref={hrefFor({ page: page > 1 ? String(page - 1) : undefined })} nextHref={hrefFor({ page: String(page + 1) })} /></Container></Section>
    <section className="border-y border-[#eadfd2] bg-[var(--signal-soft)]"><Container className="flex flex-wrap items-center justify-between gap-6 py-8"><p className="max-w-2xl text-sm leading-6 text-[#6f5b4e]">Need a date for your team? Contact the academy and we can help you plan around the published catalogue records and the requirements that apply to you.</p><a href="mailto:info@anzmigrationacademy.com" className="focus-ring rounded-full border border-[var(--signal)] px-5 py-3 text-sm font-bold text-[#85551e] hover:bg-[#f4d8cb]">Contact the academy</a></Container></section>
  </>;
}

function cnCountry(active: boolean) {
  return active ? "border-[#91b3a6] bg-[#2a5d51] text-white hover:bg-[#347263]" : "border-[#91b3a6] text-white hover:bg-[#24564c]";
}
