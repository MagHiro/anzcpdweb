import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { paymentReceipts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import { formatMoney, makePublicBookingReference } from "@/lib/utils";
import { getServerSession } from "@/server/auth/session";
import { getCustomerBookingById } from "@/server/catalogue/queries";
import { getGuestBookingByToken } from "@/server/bookings/guest-access";
import { receiptNumber } from "@/server/payments/receipts";
import { ReceiptPrintButton } from "@/components/receipt-print-button";
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
  const money = (amount: number) => formatMoney(amount, receipt.currency);
  const refunded = row.payment?.amountRefunded ?? 0;
  const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(receipt.paidAt);
  return <div className="receipt-workspace min-h-screen bg-[#f1f3ee] px-4 py-8 sm:px-8 sm:py-12">
    <div className="receipt-toolbar mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-4">
      <Link className="text-sm font-medium text-[var(--forest)] underline-offset-4 hover:underline" href={token ? `/booking/confirmation?token=${encodeURIComponent(token)}` : `/account/bookings/${id}`}>← Booking details</Link>
      <ReceiptPrintButton />
    </div>
    <article aria-labelledby="receipt-title" className="receipt-sheet mx-auto max-w-3xl border-t-4 border-[#245c45] bg-white px-6 py-10 text-[#193d32] shadow-sm sm:px-14 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-8">
        <p className="text-lg font-semibold leading-tight tracking-tight">ANZ Migration<br />Academy</p>
        <div className="sm:text-right"><h1 id="receipt-title" className="display text-4xl tracking-tight">Payment receipt</h1><p className="mt-3 text-sm text-[#5e6b63]">Paid on {date} (UTC)</p></div>
      </header>
      <div className="mt-12 border-y border-[#e0e5dd] py-8">
        <p className="text-sm text-[#5e6b63]">Amount paid · {receipt.currency}</p>
        <p className="mt-2 text-4xl font-medium tracking-tight tabular-nums sm:text-5xl">{money(receipt.amountPaid)}</p>
        <p className="mt-3 text-sm">{refunded > 0 ? "Payment received · refund recorded below" : "Payment received in full"}</p>
      </div>
      <dl className="my-9 grid gap-7 text-sm sm:grid-cols-2">
        <div><dt className="text-[#5e6b63]">Booking contact</dt><dd className="mt-2 font-medium">{receipt.recipientName}</dd><dd className="mt-1 break-all text-[#5e6b63]">{receipt.recipientEmail}</dd></div>
        <div className="sm:text-right"><dt className="text-[#5e6b63]">Booking reference</dt><dd className="mt-2 font-medium">{makePublicBookingReference(id)}</dd></div>
      </dl>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-[#e0e5dd] text-[#5e6b63]"><th scope="col" className="pb-4 font-normal">Purchase</th><th scope="col" className="pb-4 pl-5 text-right font-normal">Amount</th></tr></thead>
        <tbody><tr className="border-b border-[#e0e5dd]"><td className="py-6 font-medium leading-6">{receipt.classTitle}<span className="block font-normal text-[#5e6b63]">1 CPD class booking</span></td><td className="py-6 pl-5 text-right align-top tabular-nums">{money(receipt.amountPaid)}</td></tr></tbody>
      </table>
      <dl className="ml-auto mt-6 max-w-sm space-y-4 text-sm">
        <div className="flex justify-between gap-5 font-semibold"><dt>Total paid</dt><dd className="tabular-nums">{money(receipt.amountPaid)}</dd></div>
        {refunded > 0 && <><div className="flex justify-between gap-5 text-[#5e6b63]"><dt>Refunded to date</dt><dd className="tabular-nums">−{money(refunded)}</dd></div><div className="flex justify-between gap-5 border-t border-[#e0e5dd] pt-4 font-semibold"><dt>Net payment</dt><dd className="tabular-nums">{money(receipt.amountPaid - refunded)}</dd></div></>}
      </dl>
      <footer className="mt-14 border-t border-[#e0e5dd] pt-6 text-xs leading-6 text-[#5e6b63]">
        <p className="break-all">Receipt {receiptNumber(receipt.id)}</p>
        <p className="mt-3">Proof of payment, not a tax invoice. Booking and attendance status are shown in your booking details.</p>
        <p className="mt-2">anzmigrationacademy.com</p>
      </footer>
    </article>
  </div>;
}
