import { ClassManager } from "@/components/admin-managers";
import { getAdminClasses, getCategories, getPresenters } from "@/server/catalogue/queries";
import { LinkButton, Pagination } from "@/components/ui";

export default async function AdminClassesPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; country?: string; page?: string }> }) {
  const params = await searchParams;
  const country = params.country === "AU" || params.country === "NZ" ? params.country : undefined;
  const page = Math.max(Number(params.page) || 1, 1);
  const [rows, categories, presenters] = await Promise.all([
    getAdminClasses({ search: params.search, status: params.status, country, page, pageSize: 20 }),
    getCategories(undefined, true),
    getPresenters(true),
  ]);
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.country) query.set("country", params.country);
    query.set("page", String(nextPage));
    return `/admin/classes?${query.toString()}`;
  };

  return <div>
    <div className="admin-page-heading">
      <h1 className="display text-[var(--forest)]">Classes</h1>
      <LinkButton href="/admin/classes/new">New class</LinkButton>
    </div>
    <form className="admin-list-filters mt-8" method="get" role="search" aria-label="Filter classes">
      <input name="search" aria-label="Search title" defaultValue={params.search} placeholder="Search title" className="focus-ring px-4 text-sm" />
      <select name="status" aria-label="Status" defaultValue={params.status ?? ""} className="focus-ring px-4 text-sm">
        <option value="">All statuses</option>
        {["DRAFT", "SCHEDULED", "PUBLISHED", "SOLD_OUT", "CANCELLED", "COMPLETED", "ARCHIVED"].map(status => <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ")}</option>)}
      </select>
      <select name="country" aria-label="Country" defaultValue={params.country ?? ""} className="focus-ring px-4 text-sm">
        <option value="">All countries</option><option value="AU">Australia</option><option value="NZ">New Zealand</option>
      </select>
      <button className="focus-ring bg-[var(--forest)] px-5 text-sm font-medium text-white">Filter</button>
    </form>
    <ClassManager rows={rows} categories={categories} presenters={presenters} />
    <Pagination page={page} hasNext={rows.length === 20} previousHref={pageHref(page - 1)} nextHref={pageHref(page + 1)} />
  </div>;
}
