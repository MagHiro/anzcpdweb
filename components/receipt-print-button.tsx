"use client";

export function ReceiptPrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-lg bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4">Print / save PDF</button>;
}
