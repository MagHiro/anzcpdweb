"use client";

import { useRef, useState } from "react";
import { Button, FormNotice, TextInput, TextArea } from "@/components/ui";

export function AdminClassEmail({ classId, recipientCount }: { classId: string; recipientCount: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const pending = useRef<{ campaignId: string; subject: string; message: string } | null>(null);
  return <section className="mt-6 rounded-2xl bg-white p-5 sm:p-6" aria-label="Email participants">
    <Button type="button" variant="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>Email participants</Button>
    {open && <form className="mt-5 space-y-4" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      const form = event.currentTarget;
      const values = new FormData(form);
      const subject = String(values.get("subject") ?? "").trim();
      const message = String(values.get("message") ?? "").trim();
      if (!window.confirm(`Send this email to ${recipientCount} participant email address${recipientCount === 1 ? "" : "es"}? The current participant list will be checked when you send.`)) return;
      if (!pending.current || pending.current.subject !== subject || pending.current.message !== message) pending.current = { campaignId: crypto.randomUUID(), subject, message };
      setBusy(true); setError(undefined); setSuccess(undefined);
      try {
        const response = await fetch("/api/admin/class-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId, ...pending.current }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to queue emails.");
        setSuccess(`${result.count} emails queued. Delivery is handled by the email worker; queueing does not confirm inbox delivery.`);
        form.reset(); pending.current = null;
      } catch (error) { setError(error instanceof Error ? error.message : "Unable to queue emails."); }
      finally { setBusy(false); }
    }}>
      <p className="text-sm text-[var(--muted)]">Send a class update to {recipientCount} unique email addresses. Confirmed and partially refunded participants only. Each recipient receives a separate email.</p>
      <label className="form-field">Subject<TextInput name="subject" required maxLength={160} disabled={busy} /></label>
      <label className="form-field">Message<TextArea name="message" required maxLength={10000} rows={7} disabled={busy} /></label>
      <p className="text-xs text-[var(--muted)]">Plain text only. Line breaks are preserved. Use this for class-related updates, not marketing.</p>
      <Button type="submit" disabled={busy || recipientCount === 0}>{busy ? "Queueing…" : "Send email"}</Button>
    </form>}
    <FormNotice>{error}</FormNotice><FormNotice tone="success">{success}</FormNotice>
  </section>;
}
