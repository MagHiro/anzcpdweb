import { eq } from "drizzle-orm";
import { bookings, emailOutbox, paymentReceipts, payments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { formatMoney } from "@/lib/utils";
import { createAccountToken } from "@/server/auth/tokens";
import { queueEmail } from "@/server/email/service";

export function receiptNumber(id: string) {
  return `R-${id.replaceAll("-", "").toUpperCase()}`;
}

export function canIssueReceipt(payment: { status: string; amountCaptured: number }, paidAt: Date | null) {
  return Boolean(paidAt) && ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status);
}

/** Snapshot once per captured payment; retries never replace the original receipt. */
export async function issuePaymentReceipt(bookingId: string) {
  const db = getDb();
  const [row] = await db.select({ booking: bookings, payment: payments }).from(bookings)
    .innerJoin(payments, eq(payments.bookingId, bookings.id)).where(eq(bookings.id, bookingId)).limit(1);
  if (!row || !canIssueReceipt(row.payment, row.booking.paidAt)) return null;
  await db.insert(paymentReceipts).values({
    paymentId: row.payment.id, bookingId, recipientName: row.booking.fullName,
    recipientEmail: row.booking.email, classTitle: row.booking.classTitleSnapshot,
    amountPaid: row.payment.amountCaptured, currency: row.payment.currency, paidAt: row.booking.paidAt!,
  }).onConflictDoNothing({ target: paymentReceipts.paymentId });
  const [receipt] = await db.select().from(paymentReceipts).where(eq(paymentReceipts.paymentId, row.payment.id)).limit(1);
  return receipt ?? null;
}

export async function enqueuePaymentReceipt(bookingId: string) {
  const receipt = await issuePaymentReceipt(bookingId);
  if (!receipt) return;
  const dedupeKey = `payment-receipt:${receipt.id}`;
  const [existing] = await getDb().select({ id: emailOutbox.id }).from(emailOutbox).where(eq(emailOutbox.dedupeKey, dedupeKey)).limit(1);
  if (existing) return;
  const token = await createAccountToken({ email: receipt.recipientEmail, purpose: "GUEST_BOOKING_ACCESS", bookingId, expiresInMs: 30 * 24 * 60 * 60 * 1000 });
  await queueEmail({ type: "PAYMENT_RECEIPT", email: receipt.recipientEmail, name: receipt.recipientName,
    receiptNumber: receiptNumber(receipt.id), receiptId: receipt.id, classTitle: receipt.classTitle,
    amount: formatMoney(receipt.amountPaid, receipt.currency),
    url: `${getServerEnv().APP_URL}/booking/receipt/${bookingId}?token=${encodeURIComponent(token)}`,
  }, dedupeKey);
}
