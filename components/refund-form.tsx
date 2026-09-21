"use client";
import { ConfirmForm } from "@/components/confirm-form";
import { MoneyInput } from "@/components/money-input";

import { useActionState, useState } from "react";
import { createRefundAction, cancelBookingByAdminAction, type AdminActionState } from "@/server/actions/admin";
import { Field, FormNotice, TextArea, TextInput, Button } from "@/components/ui";

export function RefundForm({ bookingId, maxAmount, currency }: { bookingId: string; maxAmount: number; currency: string }) {
  const [state, action, pending] = useActionState(async (_state: AdminActionState, formData: FormData) => createRefundAction(formData), { ok: false } satisfies AdminActionState);
  const [key] = useState(() => crypto.randomUUID());
  return <ConfirmForm action={action} className="space-y-5" message={data => { const display = new Intl.NumberFormat("en-AU", { style: "currency", currency, currencyDisplay: "code" }).format(Number(data.get("amount")) / 100); return `Issue a ${display} refund? Stripe will process this request. The final refund state is confirmed by provider events, not by submitting this form.`; }}><input type="hidden" name="bookingId" value={bookingId} /><input type="hidden" name="idempotencyKey" value={key} /><FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice><Field label={`Refund amount in ${currency} (maximum ${new Intl.NumberFormat("en-AU", { style: "currency", currency, currencyDisplay: "code" }).format(maxAmount / 100)})`} required error={state.fieldErrors?.amount}><MoneyInput name="amount" min={0.01} maxMinor={maxAmount} required /></Field><Field label="Reason" required error={state.fieldErrors?.reason}><TextInput name="reason" placeholder="Customer cancellation" required /></Field><Field label="Internal note"><TextArea name="internalNote" placeholder="Operational context for the audit record" /></Field><Button type="submit" variant="danger" disabled={pending}>{pending ? "Starting refund…" : "Issue refund"}</Button></ConfirmForm>;
}

export function AdminCancelBookingForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(async (_state: AdminActionState, formData: FormData) => cancelBookingByAdminAction(formData), { ok: false });
  return <ConfirmForm action={action} className="space-y-2" message="Cancel this booking? Any refund remains a separate, explicit action."><input type="hidden" name="bookingId" value={bookingId} /><button type="submit" disabled={pending} className="focus-ring rounded-lg border border-[#e8bbb6] px-5 py-3 text-sm font-bold text-[var(--error)]">{pending ? "Cancelling…" : "Cancel booking (refund separately)"}</button>{state.message ? <FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice> : null}</ConfirmForm>;
}
