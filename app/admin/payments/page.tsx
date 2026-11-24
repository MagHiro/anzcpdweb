import Link from "next/link";
import { getAdminPaymentRows } from "@/server/catalogue/queries";
import { AdminRegister } from "@/components/admin-register";
import { StatusBadge } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(Math.max(Math.floor(Number(params.page)) || 1, 1), 10_000);
  const rows = await getAdminPaymentRows({ ...params, page, pageSize: 50 });
  return <AdminRegister title="Payments" href="/admin/payments" search={params.search} status={params.status}
    description="A return from checkout doesn’t confirm payment. Check the payment status here."
    statuses={["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"]}
    placeholder="Search attendee, email or class" columns={["Attendee", "Class", "Amount paid", "Refunded", "Status"]}
    count={rows.length} page={page} pageSize={50} empty="No payments match these filters.">
    {rows.map(({ payment, attendee, classTitle }) => <tr key={payment.id}>
      <td data-label="Attendee"><Link href={`/admin/bookings/${payment.bookingId}`} className="ink-link focus-ring">{attendee}</Link></td>
      <td data-label="Class">{classTitle}</td>
      <td data-label="Amount paid" className="tabular-nums">{formatMoney(payment.amountCaptured, payment.currency)}</td>
      <td data-label="Refunded" className="tabular-nums">{formatMoney(payment.amountRefunded, payment.currency)}</td>
      <td data-label="Status"><StatusBadge status={payment.status} /></td>
    </tr>)}
  </AdminRegister>;
}
