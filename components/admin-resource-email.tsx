"use client";

import { useRef, useState } from "react";
import { Button, FormNotice } from "@/components/ui";
import { resourceTemplateLabels, resourceTemplateReady, type ResourceTemplate } from "@/server/email/class-email";

export function AdminResourceEmail({ classId, recipientCount, ready }: { classId: string; recipientCount: number; ready: { materials: boolean; recording: boolean } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const pending = useRef<{ campaignId: string; template: ResourceTemplate } | null>(null);
  async function send(template: ResourceTemplate) {
    if (busy || !resourceTemplateReady(template, ready) || !recipientCount) return;
    if (!window.confirm(`Send the ${resourceTemplateLabels[template].toLowerCase()} email to ${recipientCount} participant email addresses?`)) return;
    if (pending.current?.template !== template) pending.current = { campaignId: crypto.randomUUID(), template };
    setBusy(true); setError(undefined); setSuccess(undefined);
    try {
      const response = await fetch("/api/admin/resource-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId, ...pending.current }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to queue emails.");
      setSuccess(`${result.count} emails queued. Queueing does not confirm inbox delivery.`);
      pending.current = null;
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to queue emails."); }
    finally { setBusy(false); }
  }
  return <section className="mt-6 rounded-2xl bg-white p-5 sm:p-6" aria-label="Share class resources">
    <h2 className="display text-2xl text-[var(--forest)]">Share class resources</h2>
    <p className="mt-2 text-sm text-[var(--muted)]">Email {recipientCount} unique participant addresses. Materials are attached as PDFs; recordings are accessed through their account. Confirmed and partially refunded bookings only.</p>
    <div className="mt-5 flex flex-wrap gap-3">{(Object.keys(resourceTemplateLabels) as ResourceTemplate[]).map(template => <Button key={template} type="button" variant="secondary" disabled={busy || !recipientCount || !resourceTemplateReady(template, ready)} onClick={() => void send(template)}>Send {resourceTemplateLabels[template].toLowerCase()}</Button>)}</div>
    {(!ready.materials || !ready.recording) && <p className="mt-3 text-sm text-[var(--muted)]">{!ready.materials && "Materials not ready: publish an available PDF above (18 MB combined attachment limit). "}{!ready.recording && "Recording not ready: add and publish an HTTPS recording link. "}The combined template requires both.</p>}
    <FormNotice>{error}</FormNotice><FormNotice tone="success">{success}</FormNotice>
  </section>;
}
