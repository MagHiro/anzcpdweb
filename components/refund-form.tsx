"use client";

import { useActionState, useState } from "react";
import { createRefundAction, cancelBookingByAdminAction, type AdminActionState } from "@/server/actions/admin";
import { Field, FormNotice, TextArea, TextInput, Button } from "@/components/ui";

export function RefundForm({ bookingId, maxAmount, currency }: { bookingId: string; maxAmount: number; currency: string }) {
  const [state, action, pending] = useActionState(async (_state: AdminActionState, formData: FormData) => createRefundAction(formData), { ok: false } satisfies AdminActionState);
  const [key] = useState(() => crypto.randomUUID());
  return <form action={action} className="space-y-5" onSubmit={(event) => { const amount = Number(new FormData(event.currentTarget).get("amount")); const display = new Intl.NumberFormat("en-AU", { style: "currency", currency, currencyDisplay: "code" }).format(amount / 100); if (!window.confirm(`Issue a ${display} refund? Stripe will process the request and the final state will be synchronized from webhooks.`)) event.preventDefault(); }}><input type="hidden" name="bookingId" value={bookingId} /><input type="hidden" name="idempotencyKey" value={key} /><FormNotice>{state.message}</FormNotice><Field label={`Amount in minor units (maximum ${new Intl.NumberFormat("en-AU", { style: "currency", currency, currencyDisplay: "code" }).format(maxAmount / 100)})`} required error={state.fieldErrors?.amount}><TextInput name="amount" type="number" min={1} max={maxAmount} step={1} required /></Field><Field label="Reason" required error={state.fieldErrors?.reason}><TextInput name="reason" placeholder="Customer cancellation" required /></Field><Field label="Internal note"><TextArea name="internalNote" placeholder="Operational context for the audit record" /></Field><Button type="submit" variant="danger" disabled={pending}>{pending ? "Starting refund…" : "Issue refund"}</Button></form>;
}

export function AdminCancelBookingForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(async (_state: AdminActionState, formData: FormData) => cancelBookingByAdminAction(formData), { ok: false });
  return <form action={action} className="space-y-2" onSubmit={(event) => { if (!window.confirm("Cancel this booking? Any refund remains a separate, explicit action.")) event.preventDefault(); }}><input type="hidden" name="bookingId" value={bookingId} /><button type="submit" disabled={pending} className="focus-ring rounded-full border border-[#e8bbb6] px-5 py-3 text-sm font-bold text-[var(--error)]">{pending ? "Cancelling…" : "Cancel booking (refund separately)"}</button>{state.message ? <FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice> : null}</form>;
}
