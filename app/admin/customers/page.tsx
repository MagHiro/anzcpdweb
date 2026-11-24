import { getAdminCustomerRows } from "@/server/catalogue/queries";
import { AdminRegister } from "@/components/admin-register";
import { StatusBadge } from "@/components/ui";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(Math.max(Math.floor(Number(params.page)) || 1, 1), 10_000);
  const rows = await getAdminCustomerRows(params.search, page, 25);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" });
  return <AdminRegister title="Customers" href="/admin/customers" search={params.search} placeholder="Search email"
    columns={["Customer", "Email verification", "Bookings", "Joined"]} count={rows.length} page={page} pageSize={25} empty="No customers match this search.">
    {rows.map(row => <tr key={row.id}>
      <td data-label="Customer"><strong>{row.name}</strong><small>{row.email}</small></td>
      <td data-label="Email verification"><StatusBadge status={row.emailVerified ? "VERIFIED" : "UNVERIFIED"} /></td>
      <td data-label="Bookings" className="tabular-nums">{row.bookingCount}</td>
      <td data-label="Joined"><time dateTime={row.createdAt.toISOString()}>{date.format(row.createdAt)}</time></td>
    </tr>)}
  </AdminRegister>;
}
