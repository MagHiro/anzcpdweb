import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderReceiptPdf } from "@/server/payments/receipt-pdf";

const receipt = {
  id: "d0ee2115-b34b-42e5-a615-3453dc93448d",
  bookingId: "b0ee2115-b34b-42e5-a615-3453dc93448d",
  paymentId: "c0ee2115-b34b-42e5-a615-3453dc93448d",
  recipientName: "Zoë Māori — 李明",
  recipientEmail: "zoe@example.com",
  classTitle: "Practical migration law — professional development",
  amountPaid: 14900, currency: "NZD",
  paidAt: new Date("2026-10-30T00:00:00Z"), issuedAt: new Date("2026-10-30T00:00:01Z"),
};

describe.skipIf(!process.env.GOTENBERG_URL)("receipt PDF", () => {
  it("generates a valid single-page A4 document using the browser receipt layout", async () => {
    const buffer = await renderReceiptPdf(receipt);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28, 0);
    expect(pdf.getTitle()).toContain("Payment receipt");
  });

  it("wraps long contact and class details across pages without failing", async () => {
    const buffer = await renderReceiptPdf({ ...receipt, classTitle: "Migration law and practice ".repeat(300), recipientEmail: `${"long".repeat(80)}@example.com` });
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
