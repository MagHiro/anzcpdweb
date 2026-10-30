import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import type { paymentReceipts } from "@/db/schema";
import { formatMoney, makePublicBookingReference } from "@/lib/utils";

type Receipt = typeof paymentReceipts.$inferSelect;

/** Render the original payment snapshot, not mutable booking or refund totals. */
export async function renderReceiptPdf(receipt: Receipt): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await readFile(path.join(process.cwd(), "public/fonts/DejaVuSans.ttf")), { subset: true });
  pdf.setTitle("ANZ Migration Academy · Payment receipt");
  pdf.setAuthor("ANZ Migration Academy");
  pdf.setCreationDate(receipt.issuedAt);
  const green = rgb(0.098, 0.239, 0.196);
  const muted = rgb(0.369, 0.420, 0.388);
  const line = rgb(0.878, 0.898, 0.867);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 780;
  const left = 48;
  const width = 499;

  function ensureSpace(height: number) {
    if (y - height < 48) {
      page = pdf.addPage([595.28, 841.89]);
      y = 780;
    }
  }
  function text(value: string, size = 11, color = green, maxWidth = width) {
    // Wrap by glyph rather than truncating long names, email addresses or titles.
    let current = "";
    const lines: string[] = [];
    for (const character of value.replace(/[\r\n\t]/g, " ")) {
      if (current && font.widthOfTextAtSize(current + character, size) > maxWidth) {
        lines.push(current); current = "";
      }
      current += character;
    }
    if (current) lines.push(current);
    for (const content of lines) {
      ensureSpace(size * 1.6);
      page.drawText(content, { x: left, y, font, size, color });
      y -= size * 1.6;
    }
  }
  function rule() {
    ensureSpace(24);
    page.drawLine({ start: { x: left, y }, end: { x: left + width, y }, thickness: 0.7, color: line });
    y -= 24;
  }

  page.drawRectangle({ x: left, y: 805, width, height: 3, color: green });
  text("ANZ Migration Academy", 14);
  y -= 28;
  text("Payment receipt", 28);
  text(`Paid on ${new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(receipt.paidAt)} (UTC)`, 10, muted);
  y -= 20;
  rule();
  text(`Amount paid · ${receipt.currency}`, 10, muted);
  text(formatMoney(receipt.amountPaid, receipt.currency), 32);
  text("Payment received in full", 10);
  y -= 16;
  rule();
  text("Booking contact", 10, muted);
  text(receipt.recipientName, 12);
  text(receipt.recipientEmail, 10, muted);
  y -= 12;
  text(`Booking reference: ${makePublicBookingReference(receipt.bookingId)}`, 10, muted);
  y -= 18;
  rule();
  text("Purchase", 10, muted);
  text(receipt.classTitle, 14);
  text("1 CPD class booking", 10, muted);
  y -= 14;
  rule();
  text(`Total paid   ${formatMoney(receipt.amountPaid, receipt.currency)}`, 14);
  y -= 32;
  text(`Receipt R-${receipt.id.replaceAll("-", "").toUpperCase()}`, 8, muted);
  y -= 10;
  text("Proof of payment, not a tax invoice. Booking and attendance status are shown in your booking details.", 9, muted);
  text("This document records the original payment. Any subsequent refunds appear in your online receipt.", 9, muted);
  y -= 12;
  text("anzmigrationacademy.com", 9, muted);
  return Buffer.from(await pdf.save());
}
