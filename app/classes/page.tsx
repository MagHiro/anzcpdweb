import Link from "next/link";
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
    <section className="bg-[#e8efe1]"><Container className="grid items-end gap-8 py-17 sm:py-24 lg:grid-cols-[1fr_380px]">
      <div><p className="text-sm font-semibold text-[var(--fern)]">The CPD programme</p><h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-.06em] text-[var(--forest)] sm:text-7xl">Find your next learning opportunity.</h1><p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)]">Expert-led activities built around real migration and immigration practice. Find the right subject, delivery format and schedule for you.</p></div>
      <div className="hidden rounded-[1.75rem] bg-[#d4e3c8] p-9 lg:block" data-float><div className="flex items-center justify-between text-sm font-semibold text-[#45634a]"><span>Find your focus</span><span>↗</span></div><svg role="img" aria-label="Illustration of books and learning notes" viewBox="0 0 290 145" className="mt-6 w-full" fill="none"><rect x="17" y="57" width="68" height="71" rx="10" fill="#92b49b" transform="rotate(-12 17 57)" /><rect x="87" y="18" width="87" height="110" rx="11" fill="#fffefa" transform="rotate(8 87 18)" /><path d="m107 50 41 5M105 64l30 4M102 80l38 5" stroke="#6f9376" strokeWidth="4" strokeLinecap="round" /><rect x="188" y="35" width="84" height="91" rx="12" fill="#244c3b" transform="rotate(-7 188 35)" /><path d="m210 67 35-4M210 81l26-3M210 95l32-4" stroke="#cde4bb" strokeWidth="4" strokeLinecap="round" /></svg><p className="mt-4 text-sm leading-6 text-[#526e55]">A clear way to compare CPD activities.</p></div>
    </Container></section>
    <section className="py-12 sm:py-16"><Container><div className="grid items-start gap-8 lg:grid-cols-[275px_minmax(0,1fr)] lg:gap-12">
      <aside className="filter-panel rounded-[1.4rem] bg-white p-6 shadow-[var(--shadow-soft)] lg:sticky lg:top-28">
        <div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-[-.03em]">Refine your search</h2><Link href="/classes" className="text-xs font-semibold text-[var(--fern)] underline underline-offset-4">Reset</Link></div>
        <form method="get" className="space-y-5"><input type="hidden" name="time" value={time} />
          <Field label="Search activities"><TextInput name="q" type="search" placeholder="Search a topic or title" defaultValue={params.q} /></Field>
          <Field label="Professional context"><Select name="country" defaultValue={country ?? ""}><option value="">Both countries</option><option value="AU">Australia</option><option value="NZ">New Zealand</option></Select></Field>
          <Field label="Category"><Select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map(item=><option key={item.id} value={item.slug}>{item.name}</option>)}</Select></Field>
          <Field label="Activity type"><Select name="type" defaultValue={params.type ?? ""}><option value="">All types</option>{types.map(item=><option key={item.value} value={item.value}>{item.value}</option>)}</Select></Field>
          <Field label="Delivery"><Select name="delivery" defaultValue={delivery ?? ""}><option value="">Any delivery format</option><option value="ONLINE">Online</option><option value="IN_PERSON">In person</option><option value="HYBRID">Hybrid</option></Select></Field>
          <Button type="submit" className="!w-full !rounded-full">Apply filters <ArrowRight size={16} className="ml-2" /></Button>
        </form>
      </aside>
      <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-5"><nav aria-label="Activity dates" className="flex gap-1 rounded-full bg-[#e9efe2] p-1">{(["upcoming","past"] as const).map(value=><Link key={value} href={href({time:value,page:undefined})} aria-current={time === value ? "page" : undefined} className={"rounded-full px-5 py-3 text-sm font-semibold transition " + (time === value ? "bg-[var(--forest)] text-white shadow-[0_7px_18px_rgba(26,65,45,.13)]" : "text-[var(--muted)] hover:text-[var(--forest)]")}>{value === "past" ? "Past activities" : "Upcoming"}</Link>)}</nav><p className="text-sm text-[var(--muted)]">{unavailable ? "Results temporarily unavailable" : classes.length + " activities on this page"}</p></div>
      <div className="mt-6 flex flex-wrap gap-2">{filters.map(([key,label]) => label ? <Link key={key} href={href({ [key]: undefined, page: undefined })} aria-label={"Remove filter: "+label} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--forest)] shadow-sm">{label} <span aria-hidden="true" className="text-base leading-none">×</span></Link> : null)}</div>
      <div className="mt-8">{classes.length ? <div className="grid gap-6 md:grid-cols-2">{classes.map(item=><ClassCard key={item.id} item={item} />)}</div> : <EmptyState title={unavailable ? "We couldn’t load the latest classes." : "No matching activities yet."} description={unavailable ? "Please try the catalogue again shortly or contact the academy." : "Try another topic, broaden your filters or return later for new dates."} action={<LinkButton href={unavailable ? href({}) : "/classes"} variant="secondary">{unavailable ? "Try again" : "Clear filters"} <ArrowUpRight size={16} className="ml-2" /></LinkButton>} />}</div>
      <Pagination page={page} hasNext={classes.length === 12} previousHref={href({ page:String(page-1) })} nextHref={href({ page:String(page+1) })} />
      </div>
    </div></Container></section>
  </>;
}
