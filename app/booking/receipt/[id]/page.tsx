import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { paymentReceipts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookingById } from "@/server/catalogue/queries";
import { getGuestBookingByToken } from "@/server/bookings/guest-access";
import { ReceiptPrintButton } from "@/components/receipt-print-button";
import { ReceiptDocument } from "@/components/receipt-document";
import "./receipt.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment receipt", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ReceiptPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  if (!uuidSchema.safeParse(id).success) notFound();
  const session = await getServerSession();
  const row = token ? await getGuestBookingByToken(token) : session ? await getCustomerBookingById(session.user.id, id) : null;
  if (!row || row.booking.id !== id) notFound();
  const [receipt] = await getDb().select().from(paymentReceipts).where(eq(paymentReceipts.bookingId, id)).limit(1);
  if (!receipt) notFound();
  const refunded = row.payment?.amountRefunded ?? 0;
  return <div className="receipt-workspace min-h-screen bg-[#f1f3ee] px-4 py-8 sm:px-8 sm:py-12">
    <div className="receipt-toolbar mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-4">
      <Link className="text-sm font-medium text-[var(--forest)] underline-offset-4 hover:underline" href={token ? `/booking/confirmation?token=${encodeURIComponent(token)}` : `/account/bookings/${id}`}>← Booking details</Link>
      <ReceiptPrintButton />
    </div>
    <ReceiptDocument receipt={receipt} refunded={refunded} />
  </div>;
}
