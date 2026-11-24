import Link from "next/link";
import { ArrowRight, ArrowUpRight, CloseIcon } from "@/components/icon";
import { Button, ClassCard, Container, Field, LinkButton, Pagination, Select, TextInput } from "@/components/ui";
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
  const categoryLabel = categories.find(item => item.slug === params.category)?.name ?? params.category?.replaceAll("-", " ");
  const filters = ([["country", country === "AU" ? "Australia" : country === "NZ" ? "New Zealand" : undefined], ["category", categoryLabel], ["delivery", delivery === "ONLINE" ? "Online" : delivery === "IN_PERSON" ? "In person" : delivery === "HYBRID" ? "Hybrid" : undefined], ["type", params.type], ["q", params.q]] as const).filter(([, label]) => label);
  return <>
    <section className="catalogue-introduction"><Container className="catalogue-introduction-layout">
      <h1>CPD classes</h1>
      <nav aria-label="Activity dates" className="catalogue-period">
        {(["upcoming", "past"] as const).map(value => <Link key={value} href={href({ time: value, page: undefined })} aria-current={time === value ? "page" : undefined} className="focus-ring">{value === "past" ? "Past activities" : "Upcoming"}</Link>)}
      </nav>
    </Container></section>
    <section className="catalogue-body"><Container><div className="grid gap-8">
      <details className="catalogue-toolbar" open>
        <summary className="focus-ring">Search and filters <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 10 5 5 5-5" /></svg></summary>
        <form method="get"><input type="hidden" name="time" value={time} />
          <Field label="Search activities" className="catalogue-search"><TextInput name="q" type="search" placeholder="Search by title or topic" defaultValue={params.q} /></Field>
          <div className="catalogue-selects">
            <Field label="Country"><Select name="country" defaultValue={country ?? ""}><option value="">Both countries</option><option value="AU">Australia</option><option value="NZ">New Zealand</option></Select></Field>
            <Field label="Category"><Select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></Field>
            <Field label="Activity type"><Select name="type" defaultValue={params.type ?? ""}><option value="">All types</option>{types.map(item => <option key={item.value} value={item.value}>{item.value}</option>)}</Select></Field>
            <Field label="Delivery"><Select name="delivery" defaultValue={delivery ?? ""}><option value="">Any format</option><option value="ONLINE">Online</option><option value="IN_PERSON">In person</option><option value="HYBRID">Hybrid</option></Select></Field>
          </div>
          <div className="catalogue-filter-actions"><Link href={time === "past" ? "/classes?time=past" : "/classes"} className="focus-ring catalogue-reset">Reset</Link><Button type="submit">Apply filters <ArrowRight size={18} className="ml-3" /></Button></div>
        </form>
      </details>
      <div className="min-w-0">
       {(classes.length > 0 || filters.length > 0) && <div className="catalogue-results-bar">
         {classes.length > 0 && <p>{classes.length === 1 ? "1 class" : `${classes.length} classes`} on this page</p>}
         {filters.length > 0 && <ul aria-label="Applied filters">{filters.map(([key, label]) => <li key={key}><Link href={href({ [key]: undefined, page: undefined })} aria-label={`Remove filter: ${label}`} className="catalogue-filter-chip focus-ring">{label}<CloseIcon size={14} /></Link></li>)}</ul>}
       </div>}
       {classes.length ? <div className="class-schedule-grid">{classes.map(item => <ClassCard key={item.id} item={item} variant="schedule" />)}</div> : <section className="catalogue-empty" aria-labelledby="catalogue-empty-title">
         <h2 id="catalogue-empty-title">{unavailable ? "Classes are temporarily unavailable" : filters.length ? "No classes match your filters" : time === "past" ? "No past classes" : "No upcoming classes"}</h2>
         {(unavailable || filters.length > 0 || time === "past") && <LinkButton href={unavailable ? href({}) : filters.length ? href({country:undefined,category:undefined,delivery:undefined,type:undefined,q:undefined,page:undefined}) : "/classes"}>{unavailable ? "Try again" : filters.length ? "Clear filters" : "View upcoming classes"} <ArrowUpRight size={18} className="ml-3" /></LinkButton>}
       </section>}
      <Pagination page={page} hasNext={classes.length === 12} previousHref={href({ page:String(page-1) })} nextHref={href({ page:String(page+1) })} />
      </div>
    </div></Container></section>
  </>;
}
