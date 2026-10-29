import Link from "next/link";
import { and, asc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { auditLogs, bookings, payments, refunds, webhookEvents } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdminSession } from "@/server/auth/session";
import { formatMoney, makePublicBookingReference } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import { ReconciliationForm } from "@/components/reconciliation-form";

export default async function OperationsPage() {
  await requireAdminSession();
  const db = getDb();
  const staleAt = sql`now() - interval '45 minutes'`;
  const [paymentRows, refundRows, failedEvents, exceptions] = await Promise.all([
    db.select({ booking: bookings, payment: payments }).from(bookings).innerJoin(payments, eq(payments.bookingId, bookings.id)).where(or(and(eq(bookings.status, "CANCELLED"), gt(payments.amountCaptured, payments.amountRefunded)), and(inArray(bookings.status, ["PENDING_PAYMENT", "PAYMENT_PROCESSING"]), lt(bookings.updatedAt, staleAt)))).orderBy(asc(bookings.updatedAt)).limit(100),
    db.select().from(refunds).where(inArray(refunds.status, ["PENDING", "REQUIRES_ACTION", "FAILED"])).orderBy(asc(refunds.updatedAt)).limit(100),
    db.select().from(webhookEvents).where(or(eq(webhookEvents.status, "FAILED"), and(eq(webhookEvents.status, "PROCESSING"), lt(webhookEvents.updatedAt, sql`now() - interval '5 minutes'`)))).orderBy(asc(webhookEvents.updatedAt)).limit(100),
    db.select().from(auditLogs).where(eq(auditLogs.action, "CAPTURE_REQUIRES_RECONCILIATION")).orderBy(sql`${auditLogs.createdAt} desc`).limit(30),
  ]);
  return <div className="space-y-10">
    <div><h1 className="display text-4xl text-[var(--forest)]">Operational queues</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">Oldest items first, up to 100 per queue. Checking Stripe reads and reconciles provider state; it does not charge customers or initiate refunds.</p></div>
    <section><h2 className="text-2xl">Payments requiring review</h2><p className="mt-2 text-sm text-[var(--muted)]">Cancelled bookings with an unrefunded balance, or unresolved checkouts older than 45 minutes.</p><div className="mt-5 divide-y divide-[var(--line)]">{paymentRows.length ? paymentRows.map(({ booking, payment }) => <div key={booking.id} className="flex flex-wrap items-start justify-between gap-5 py-6"><div className="min-w-0"><Link className="ink-link" href={`/admin/bookings/${booking.id}`}>{makePublicBookingReference(booking.id)}</Link><p className="mt-2 break-words">{booking.fullName} · {booking.classTitleSnapshot}</p><p className="mt-2 text-sm text-[var(--muted)]">Captured {formatMoney(payment.amountCaptured, payment.currency)} · Refunded {formatMoney(payment.amountRefunded, payment.currency)}</p><div className="mt-3 flex gap-2"><StatusBadge status={booking.status} /><StatusBadge status={payment.status} /></div></div>{booking.stripeCheckoutSessionId && <ReconciliationForm bookingId={booking.id} />}</div>) : <p className="py-6 text-sm text-[var(--muted)]">No payments requiring review.</p>}</div></section>
    <section><h2 className="text-2xl">Refund follow-up</h2><div className="mt-5 divide-y divide-[var(--line)]">{refundRows.length ? refundRows.map(refund => <div key={refund.id} className="flex flex-wrap justify-between gap-4 py-5"><Link className="ink-link" href={`/admin/bookings/${refund.bookingId}`}>{makePublicBookingReference(refund.bookingId)} · {formatMoney(refund.amount, refund.currency)}</Link><StatusBadge status={refund.status} /><ReconciliationForm bookingId={refund.bookingId} /></div>) : <p className="py-6 text-sm text-[var(--muted)]">No refunds requiring follow-up.</p>}</div></section>
    <section><h2 className="text-2xl">Webhook recovery</h2><p className="mt-2 text-sm text-[var(--muted)]">Failed or stalled events require provider redelivery after the cause is resolved. Booking payments can also be checked using the queues above.</p><ul className="mt-5 divide-y divide-[var(--line)]">{failedEvents.map(event => <li key={event.id} className="py-5"><p className="break-all font-mono text-xs">{event.stripeEventId} · {event.type}</p><p className="mt-2 text-sm text-[var(--muted)]">{event.errorMessage ?? "Processing lease expired"}</p></li>)}</ul>{!failedEvents.length && <p className="py-6 text-sm text-[var(--muted)]">No failed or stalled events.</p>}</section>
    <section><h2 className="text-2xl">Recent capture exceptions</h2><ul className="mt-5 space-y-4">{exceptions.map(event => <li key={event.id}><Link className="ink-link" href={`/admin/bookings/${event.entityId}`}>{makePublicBookingReference(event.entityId)}</Link><time className="ml-4 text-xs text-[var(--muted)]">{event.createdAt.toISOString()}</time></li>)}</ul></section>
  </div>;
}
