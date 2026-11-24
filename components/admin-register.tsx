import type { ReactNode } from "react";
import Link from "next/link";
import { Button, formatStatusLabel, Pagination } from "@/components/ui";
import { AdminPageHeading } from "@/components/admin-page-heading";

export function AdminRegister({ title, href, search, status, statuses, placeholder, columns, children, count, pageSize, page, description, empty }: {
  title: string; href: string; search?: string; status?: string; statuses?: string[]; placeholder: string;
  columns: string[]; children: ReactNode; count: number; pageSize: number; page: number; description?: string; empty: string;
}) {
  const pageHref = (number: number) => `${href}?${new URLSearchParams({ ...(search ? { search } : {}), ...(status ? { status } : {}), page: String(number) })}`;
  return <div>
    <AdminPageHeading title={title} description={description} />
    <form method="get" role="search" aria-label={`Filter ${title.toLowerCase()}`} className="admin-list-filters admin-register-filters">
      <input className="focus-ring px-4" name="search" aria-label={placeholder} placeholder={placeholder} defaultValue={search} />
      {statuses && <select className="focus-ring px-4" name="status" aria-label="Status" defaultValue={status ?? ""}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{formatStatusLabel(value)}</option>)}</select>}
      <Button type="submit">{statuses ? "Filter" : "Search"}</Button>
      {(search || status) && <Link href={href} className="admin-filter-clear focus-ring">Clear</Link>}
    </form>
    <div className="admin-register-table overflow-x-auto">
      <table aria-label={title}><thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table>
      {!count && <p className="admin-register-empty">{empty}</p>}
    </div>
    <Pagination page={page} hasNext={count === pageSize} previousHref={pageHref(page - 1)} nextHref={pageHref(page + 1)} />
  </div>;
}
