/* Standalone print document, not a Next.js page. */
/* eslint-disable @next/next/no-head-element */
import { render } from "@react-email/render";
import { ReceiptDocument, type ReceiptSnapshot } from "@/components/receipt-document";

/** Render a trusted, self-contained snapshot; no private receipt URL or token is sent. */
export async function renderReceiptPdf(receipt: ReceiptSnapshot): Promise<Buffer> {
  const html = await render(<html lang="en"><head><meta charSet="utf-8" /><title>ANZ Migration Academy · Payment receipt</title><style>{"@page { size: A4; margin: 12mm; } body { margin: 0; background: white; }"}</style></head><body><ReceiptDocument receipt={receipt} attachment /></body></html>);
  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  form.append("preferCssPageSize", "true");
  form.append("printBackground", "true");
  form.append("marginTop", "0");
  form.append("marginBottom", "0");
  form.append("marginLeft", "0");
  form.append("marginRight", "0");
  const response = await fetch(`${process.env.GOTENBERG_URL ?? "http://127.0.0.1:3002"}/forms/chromium/convert/html`, { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Receipt PDF rendering failed (${response.status}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new Error("Receipt renderer returned an invalid PDF.");
  return buffer;
}
