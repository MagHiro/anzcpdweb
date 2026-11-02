import type { paymentReceipts } from "@/db/schema";
import { formatMoney, makePublicBookingReference } from "@/lib/utils";

export type ReceiptSnapshot = typeof paymentReceipts.$inferSelect;

// The browser and attached PDF use the same markup and print styles.
export function ReceiptDocument({ receipt, refunded = 0, attachment = false }: { receipt: ReceiptSnapshot; refunded?: number; attachment?: boolean }) {
  const money = (amount: number) => formatMoney(amount, receipt.currency);
  const free = receipt.amountPaid === 0;
  const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(receipt.paidAt);
  return <article aria-labelledby="receipt-title" className="receipt-document">
    <style>{`
      .receipt-document { box-sizing: border-box; max-width: 768px; margin: auto; padding: 56px; border-top: 4px solid #245c45; background: white; color: #193d32; font: 14px/1.6 Arial, sans-serif; overflow-wrap: anywhere; }
      .receipt-document * { box-sizing: border-box; }
      .receipt-document p, .receipt-document h1, .receipt-document dl, .receipt-document dd { margin: 0; }
      .receipt-document header { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; }
      .receipt-document .receipt-brand { font-size: 18px; line-height: 1.2; font-weight: 600; }
      .receipt-document .receipt-heading { text-align: right; }
      .receipt-document h1 { font-size: 36px; line-height: 1.2; font-weight: 500; letter-spacing: -1px; }
      .receipt-document .receipt-muted, .receipt-document dt { color: #5e6b63; }
      .receipt-document .receipt-heading p { margin-top: 12px; }
      .receipt-document .receipt-amount { border-block: 1px solid #e0e5dd; margin-top: 48px; padding-block: 32px; }
      .receipt-document .receipt-total { font-size: 48px; line-height: 1.2; letter-spacing: -1px; margin: 8px 0 12px; font-weight: 500; }
      .receipt-document .receipt-contact { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin: 36px 0; }
      .receipt-document dd { margin-top: 8px; font-weight: 500; }
      .receipt-document .receipt-reference { text-align: right; }
      .receipt-document table { border-collapse: collapse; width: 100%; text-align: left; table-layout: fixed; }
      .receipt-document th { padding-bottom: 16px; font-weight: 400; color: #5e6b63; }
      .receipt-document tr { border-bottom: 1px solid #e0e5dd; }
      .receipt-document td { padding: 24px 0; vertical-align: top; }
      .receipt-document th:last-child, .receipt-document td:last-child { text-align: right; width: 28%; padding-left: 20px; }
      .receipt-document .receipt-summary { max-width: 384px; margin: 24px 0 0 auto; }
      .receipt-document .receipt-summary div { display: flex; justify-content: space-between; gap: 20px; margin-top: 16px; }
      .receipt-document .receipt-summary dt { color: inherit; }
      .receipt-document .receipt-summary dd { margin: 0; }
      .receipt-document footer { border-top: 1px solid #e0e5dd; margin-top: 56px; padding-top: 24px; font-size: 12px; line-height: 2; color: #5e6b63; }
      .receipt-document footer p + p { margin-top: 12px; }
      @media screen and (max-width: 600px) { .receipt-document { padding: 32px 24px; } .receipt-document header { flex-direction: column; } .receipt-document .receipt-heading { text-align: left; } .receipt-document .receipt-contact { grid-template-columns: 1fr; } .receipt-document .receipt-reference { text-align: left; } }
      @media print { .receipt-document { max-width: none; padding: 20px 24px; box-shadow: none; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .receipt-document header, .receipt-document .receipt-amount, .receipt-document .receipt-contact, .receipt-document .receipt-summary, .receipt-document footer { break-inside: avoid; } .receipt-document thead { display: table-header-group; } }
    `}</style>
    <header><p className="receipt-brand">ANZ Migration<br />Academy</p><div className="receipt-heading"><h1 id="receipt-title">{free ? "Booking receipt" : "Payment receipt"}</h1><p className="receipt-muted">{free ? "Confirmed" : "Paid"} on {date} (UTC)</p></div></header>
    <div className="receipt-amount"><p className="receipt-muted">{free ? "Booking total" : "Amount paid"} · {receipt.currency}</p><p className="receipt-total">{money(receipt.amountPaid)}</p><p>{free ? "Free booking · No payment required" : refunded > 0 ? "Payment received · refund recorded below" : "Payment received in full"}</p></div>
    <dl className="receipt-contact"><div><dt>Booking contact</dt><dd>{receipt.recipientName}</dd><dd className="receipt-muted">{receipt.recipientEmail}</dd></div><div className="receipt-reference"><dt>Booking reference</dt><dd>{makePublicBookingReference(receipt.bookingId)}</dd></div></dl>
    <table><thead><tr><th scope="col">Purchase</th><th scope="col">Amount</th></tr></thead><tbody><tr><td>{receipt.classTitle}<p className="receipt-muted">1 CPD class booking</p></td><td>{money(receipt.amountPaid)}</td></tr></tbody></table>
    <dl className="receipt-summary"><div><dt>{free ? "Booking total" : "Total paid"}</dt><dd>{money(receipt.amountPaid)}</dd></div>{refunded > 0 && <><div><dt>Refunded to date</dt><dd>−{money(refunded)}</dd></div><div><dt>Net payment</dt><dd>{money(receipt.amountPaid - refunded)}</dd></div></>}</dl>
    <footer><p>Receipt R-{receipt.id.replaceAll("-", "").toUpperCase()}</p><p>{free ? "Receipt for a free booking, not a tax invoice. No payment was collected." : "Proof of payment, not a tax invoice."} Booking and attendance status are shown in your booking details.</p>{attachment && !free && <p>This document records the original payment. Any subsequent refunds appear in your online receipt.</p>}<p>anzmigrationacademy.com</p></footer>
  </article>;
}
