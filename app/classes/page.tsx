import Link from "next/link";
import { TimezoneSelector } from "@/components/visitor-time";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { Button, ClassCard, Container, EmptyState, Field, LinkButton, Pagination, Select, TextInput } from "@/components/ui";
import { getCategories, getPublishedActivityTypes, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";
type Params = { country?: string; category?: string; delivery?: string; time?: string; type?: string; q?: string; page?: string };

export default async function ClassesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const country = params.country === "AU" || params.country === "NZ" ? params.country : undefined;
  const delivery = params.delivery === "ONLINE" || params.delivery === "IN_PERSON" || params.delivery === "HYBRID" ? params.delivery : undefined;
  const time = params.time === "past" ? "past" : "upcoming";
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.page) || 1)));
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let types: Awaited<ReturnType<typeof getPublishedActivityTypes>> = [];
  let classes: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  let unavailable = false;
  try { [categories, types, classes] = await Promise.all([getCategories(country), getPublishedActivityTypes(country), getPublishedClasses({ country, categorySlug: params.category, activityType: params.type, deliveryFormat: delivery, time, search: params.q, page })]); } catch { unavailable = true; }
  const href = (changes: Partial<Record<keyof Params, string | undefined>>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...changes })) if (value) query.set(key, value);
    return "/classes" + (query.size ? "?" + query.toString() : "");
  };
  const filters = [["country", country === "AU" ? "Australia" : country === "NZ" ? "New Zealand" : undefined], ["category", params.category], ["delivery", delivery?.replaceAll("_", " ").toLowerCase()], ["type", params.type], ["q", params.q]] as const;
  return <>
    <section className="border-b border-[var(--line)] bg-white"><Container className="py-20 sm:py-24">
      <h1 className="max-w-5xl text-5xl leading-none text-[var(--forest)] sm:text-7xl">Find your next learning opportunity.</h1><p className="mt-8 max-w-2xl text-lg leading-7 text-[var(--muted)]">Expert-led activities built around real migration and immigration practice. Find the right subject, delivery format and schedule for you.</p>
    </Container></section>
    <section className="py-10 sm:py-16"><Container><div className="grid gap-8">
      <details className="catalogue-toolbar" open>
        <summary className="cursor-pointer font-semibold">Search and filters</summary>
        <div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-[-.03em]">Refine your search</h2><Link href="/classes" className="text-xs font-semibold text-[var(--fern)] underline underline-offset-4">Reset</Link></div>
        <form method="get"><input type="hidden" name="time" value={time} />
          <Field label="Search activities"><TextInput name="q" type="search" placeholder="Search a topic or title" defaultValue={params.q} /></Field>
          <Field label="Professional context"><Select name="country" defaultValue={country ?? ""}><option value="">Both countries</option><option value="AU">Australia</option><option value="NZ">New Zealand</option></Select></Field>
          <Field label="Category"><Select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map(item=><option key={item.id} value={item.slug}>{item.name}</option>)}</Select></Field>
          <Field label="Activity type"><Select name="type" defaultValue={params.type ?? ""}><option value="">All types</option>{types.map(item=><option key={item.value} value={item.value}>{item.value}</option>)}</Select></Field>
          <Field label="Delivery"><Select name="delivery" defaultValue={delivery ?? ""}><option value="">Any delivery format</option><option value="ONLINE">Online</option><option value="IN_PERSON">In person</option><option value="HYBRID">Hybrid</option></Select></Field>
          <Button type="submit" className="!w-full !rounded-full">Apply filters <ArrowRight size={16} className="ml-2" /></Button>
        </form>
        {classes.some(item => item.deliveryFormat === "ONLINE") && <TimezoneSelector timezone="Australia/Sydney" />}
      </details>
      <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-5"><nav aria-label="Activity dates" className="flex flex-wrap gap-2">{(["upcoming","past"] as const).map(value=><Link key={value} href={href({time:value,page:undefined})} aria-current={time === value ? "page" : undefined} className={"rounded-full border px-5 py-3 text-sm transition " + (time === value ? "border-[var(--forest)] bg-[var(--forest)] text-white" : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--forest)]")}>{value === "past" ? "Past activities" : "Upcoming"}</Link>)}</nav><p className="text-sm text-[var(--muted)]">{unavailable ? "Results temporarily unavailable" : classes.length + " activities on this page"}</p></div>
      <div className="mt-6 flex flex-wrap gap-2">{filters.map(([key,label]) => label ? <Link key={key} href={href({ [key]: undefined, page: undefined })} aria-label={"Remove filter: "+label} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-2 text-xs text-[var(--forest)]">{label} <span aria-hidden="true" className="text-base leading-none">×</span></Link> : null)}</div>
      <div className="mt-8">{classes.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{classes.map(item=><ClassCard key={item.id} item={item} />)}</div> : <EmptyState title={unavailable ? "We couldn’t load the latest classes." : "No matching activities yet."} description={unavailable ? "Please try the catalogue again shortly or contact the academy." : "Try another topic, broaden your filters or return later for new dates."} action={<LinkButton href={unavailable ? href({}) : "/classes"} variant="secondary">{unavailable ? "Try again" : "Clear filters"} <ArrowUpRight size={16} className="ml-2" /></LinkButton>} />}</div>
      <Pagination page={page} hasNext={classes.length === 12} previousHref={href({ page:String(page-1) })} nextHref={href({ page:String(page+1) })} />
      </div>
    </div></Container></section>
  </>;
}
