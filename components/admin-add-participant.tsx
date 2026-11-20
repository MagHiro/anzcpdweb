"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, FormNotice, TextInput } from "@/components/ui";
import { AdminModal } from "@/components/admin-modal";

export function AdminAddParticipant({ classId, paid }: { classId: string; paid: boolean }) {
  const router = useRouter();
  const request = useRef<{ payload: string; id: string } | null>(null);
  const [mode, setMode] = useState("LINK");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [link, setLink] = useState<string>();
  const [open, setOpen] = useState(false);
  return <div className="mt-6">
    <Button type="button" onClick={() => setOpen(true)}>Add participant</Button>
    <AdminModal open={open} onClose={() => { if (!busy) setOpen(false); }} title="Add participant" size="medium">
    <FormNotice>{error}</FormNotice><FormNotice tone="success">{success}</FormNotice>
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      const payload = JSON.stringify({ ...data, classId, mode, policiesConfirmed: data.policiesConfirmed === "on" });
      if (request.current?.payload !== payload) request.current = { payload, id: crypto.randomUUID() };
      setBusy(true); setError(undefined); setSuccess(undefined); setLink(undefined);
      try {
        const response = await fetch("/api/admin/participants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...JSON.parse(payload), requestId: request.current.id }) });
        const result = await response.json().catch(() => { throw new Error(`Request failed (${response.status}). Reload and try again.`); });
        if (!response.ok) throw new Error(result.error ?? "Participant could not be added.");
        setLink(result.paymentUrl ?? undefined);
        setSuccess(result.confirmed ? "Participant added. Confirmation and receipt emails queued." : `Payment link ready. The seat is reserved until ${new Date(result.expiresAt).toLocaleString()}. The booking is confirmed only after payment.`);
        form.reset(); request.current = null; router.refresh();
      } catch (error) { setError(error instanceof Error ? error.message : "Participant could not be added."); }
      finally { setBusy(false); }
    }}>
      <Field label="Full name" required><TextInput name="fullName" required maxLength={180} disabled={busy} /></Field>
      <Field label="Email" required><TextInput name="email" type="email" required maxLength={254} disabled={busy} /></Field>
      <Field label="Professional identifier"><TextInput name="professionalIdentifier" maxLength={80} disabled={busy} /></Field>
      {paid && <Field label="Payment"><select value={mode} disabled={busy} onChange={event => setMode(event.target.value)} className="focus-ring min-h-11 w-full rounded-xl bg-[var(--mist)] px-4 text-sm"><option value="LINK">Create payment link</option><option value="VERIFIED">Payment manually verified</option></select></Field>}
      <label className="flex items-start gap-3 text-sm sm:col-span-2"><input name="policiesConfirmed" type="checkbox" required disabled={busy} className="mt-1" /><span>I have the participant’s permission to book and confirmation that they accept the <a href="/terms" target="_blank" className="ink-link">terms</a> and <a href="/refund-policy" target="_blank" className="ink-link">refund policy</a>{paid && mode === "VERIFIED" ? ", and I have verified receipt of the full class payment." : "."}</span></label>
      {paid && mode === "LINK" && <p className="text-sm text-[var(--muted)] sm:col-span-2">Payment links expire after 31 minutes. Share the link promptly; confirmation is sent after payment.</p>}
      <div className="sm:col-span-2"><Button disabled={busy}>{busy ? "Saving…" : paid && mode === "LINK" ? "Create payment link" : "Add participant"}</Button></div>
    </form>
    {link && <div className="mt-5 flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><Field label="Payment link"><TextInput value={link} readOnly onFocus={event => event.target.select()} /></Field></div><Button type="button" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(link); setSuccess("Payment link copied."); } catch { setError("Select and copy the payment link above."); } }}>Copy link</Button></div>}
    </AdminModal>
  </div>;
}
