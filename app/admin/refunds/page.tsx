import Link from "next/link";
import { getAdminRefundRows } from "@/server/catalogue/queries";
import { AdminRegister } from "@/components/admin-register";
import { StatusBadge } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

export default async function AdminRefundsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(Math.max(Math.floor(Number(params.page)) || 1, 1), 10_000);
  const rows = await getAdminRefundRows({ ...params, page, pageSize: 50 });
  return <AdminRegister title="Refunds" href="/admin/refunds" search={params.search} status={params.status}
    statuses={["PENDING", "SUCCEEDED", "FAILED", "REQUIRES_ACTION", "CANCELLED"]}
    placeholder="Search attendee, email, class or reason" columns={["Booking", "Class", "Amount", "Reason", "Status"]}
    count={rows.length} page={page} pageSize={50} empty="No refunds match these filters.">
    {rows.map(({ refund, attendee, bookingReference, classTitle }) => <tr key={refund.id}>
      <td data-label="Booking"><Link href={`/admin/bookings/${refund.bookingId}`} className="ink-link focus-ring">{attendee}</Link><small>{bookingReference}</small></td>
      <td data-label="Class">{classTitle}</td>
      <td data-label="Amount" className="tabular-nums">{formatMoney(refund.amount, refund.currency)}</td>
      <td data-label="Reason">{refund.reason}</td>
      <td data-label="Status"><StatusBadge status={refund.status} /></td>
    </tr>)}
  </AdminRegister>;
}
