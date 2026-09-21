import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { ActivityCard, Button, Container, EmptyState, LinkButton, PageHeader, PageIntro, Pagination, Section, Select, TextInput } from "@/components/ui";
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
  const selectedFilterCount = [selectedCountry, selectedCategory, selectedType, search].filter(Boolean).length;

  return <>
    <section className="grain relative overflow-hidden bg-[var(--color-brand)] text-white"><div className="pointer-events-none absolute inset-0 dot-grid opacity-20" /><Container className="relative py-14 sm:py-20"><PageIntro tone="light" eyebrow="Activity catalogue" title="Find your next CPD activity." description="Compare the country, format, date, CPD value and presenter before you decide where to spend your time."><nav aria-label="Filter activities by country" className="mt-7 flex flex-wrap gap-2"><LinkButton href={hrefFor({ country: undefined, category: undefined, type: undefined, q: undefined })} size="sm" className="bg-[var(--color-accent)] text-white hover:bg-[#e18464]">All activities</LinkButton>{countries.map((country) => <Link key={country.code} href={hrefFor({ country: country.code })} className={`focus-ring inline-flex min-h-9 items-center justify-center rounded-[.55rem] border px-3.5 text-xs font-bold transition ${selectedCountry === country.code ? "border-white bg-white text-[var(--color-brand)]" : "border-[#8fb6a6] text-white hover:border-white hover:bg-white/10"}`}>{country.name}</Link>)}</nav></PageIntro></Container></section>
    <Section className="bg-[var(--color-canvas)]"><Container><form className="rounded-[.85rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-surface)]" method="get"><div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(12rem,1fr)_minmax(12rem,1fr)_auto]"><div><label className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--color-muted)]" htmlFor="q">Search by topic</label><TextInput id="q" name="q" placeholder="Try a topic or title" defaultValue={search} /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--color-muted)]" htmlFor="category">Category</label><Select id="category" name="category" defaultValue={selectedCategory ?? ""}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</Select></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--color-muted)]" htmlFor="type">Activity type</label><Select id="type" name="type" defaultValue={selectedType ?? ""}><option value="">All activity types</option>{activityTypes.map((activity) => <option key={activity.value} value={activity.value}>{activity.value}</option>)}</Select></div><div className="flex items-end"><Button type="submit" className="w-full lg:w-auto">Apply filters</Button></div></div><input type="hidden" name="country" value={selectedCountry ?? ""} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3"><p className="text-xs text-[var(--color-muted)]">{selectedFilterCount ? `${selectedFilterCount} filter${selectedFilterCount === 1 ? "" : "s"} applied` : "Showing all published activities"}</p><div className="flex items-center gap-4 text-sm">{selectedFilterCount ? <Link href="/courses" className="focus-ring rounded-sm font-bold text-[var(--color-danger)] underline underline-offset-4">Clear all</Link> : null}<span className="text-xs text-[var(--color-subtle)]">Results update after applying</span></div></div></form><div className="mt-12"><PageHeader headingLevel="h2" eyebrow={classes.length ? `${classes.length} published activities` : "Activity catalogue"} title="Upcoming CPD" description="A focused list of the next available learning opportunities." actions={<Link href="/cpd-requirements" className="focus-ring inline-flex items-center gap-2 rounded-[.55rem] px-2 py-2 text-sm font-bold text-[var(--color-brand)] underline decoration-[var(--color-accent)] underline-offset-4 hover:bg-[var(--color-inset)]">Read the CPD guide <ArrowUpRight size={16} /></Link>} /></div><div className="mt-8 overflow-x-auto border-y border-[var(--color-border)] py-3"><div className="flex min-w-max items-center gap-2 text-xs font-semibold"><span className="mr-2 text-[var(--color-muted)]">Browse by category</span>{categories.map((category) => <Link key={category.id} href={hrefFor({ category: category.slug })} className={`rounded-[.55rem] px-3 py-2 ${selectedCategory === category.slug ? "bg-[var(--color-brand)] text-white" : "text-[var(--color-muted)] hover:bg-[var(--color-inset)] hover:text-[var(--color-ink)]"}`}>{category.name}</Link>)}{selectedFilterCount ? <Link href="/courses" className="ml-2 rounded-[.55rem] px-3 py-2 font-bold text-[var(--color-danger)] underline underline-offset-4">Clear filters</Link> : null}</div></div>{classes.length ? <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{classes.map((item) => <ActivityCard key={item.id} item={item} />)}</div> : <div className="mt-8"><EmptyState eyebrow={selectedFilterCount ? "No matches" : "No live dates yet"} title={selectedFilterCount ? "No published activities match these filters." : "The next dates are being prepared."} description={selectedFilterCount ? "Try removing a filter or searching for a broader topic." : "Check back soon, or read the CPD guide while the next catalogue records are published."} action={<><LinkButton href="/courses" variant="secondary">Show all activities</LinkButton><LinkButton href="/cpd-requirements" variant="quiet">Read the guide</LinkButton></>} /></div>}<Pagination page={page} hasNext={classes.length === 12} previousHref={hrefFor({ page: page > 1 ? String(page - 1) : undefined })} nextHref={hrefFor({ page: String(page + 1) })} /></Container></Section>
    <section className="border-y border-[var(--color-border)] bg-[var(--color-accent-soft)]"><Container className="flex flex-wrap items-center justify-between gap-6 py-8"><p className="max-w-2xl text-sm leading-6 text-[#6f5b4e]">Planning CPD for a team? Contact the academy for help finding a suitable date or understanding the published catalogue.</p><a href="mailto:info@anzmigrationacademy.com" className="focus-ring rounded-[.6rem] border border-[var(--color-accent)] px-5 py-3 text-sm font-bold text-[#85551e] hover:bg-[#f4d8cb]">Contact the academy</a></Container></section>
  </>;
}
