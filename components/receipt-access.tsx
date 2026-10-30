import Link from "next/link";

export function ReceiptAccess({ bookingId, token }: { bookingId: string; token?: string }) {
  return <Link href={`/booking/receipt/${bookingId}${token ? `?token=${encodeURIComponent(token)}` : ""}`} className="inline-flex rounded-lg border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]">View payment receipt</Link>;
}
