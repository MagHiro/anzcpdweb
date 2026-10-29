"use client";

import { useActionState } from "react";
import { reconcilePaymentAction } from "@/server/actions/reconciliation";
import { Button, FormNotice } from "@/components/ui";

export function ReconciliationForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(reconcilePaymentAction, { ok: false, message: "" });
  return <form action={action} className="space-y-3"><input type="hidden" name="bookingId" value={bookingId} /><Button type="submit" variant="secondary" size="sm" disabled={pending}>{pending ? "Checking Stripe…" : "Check Stripe"}</Button><FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice></form>;
}
