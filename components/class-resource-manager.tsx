"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, FormNotice, TextInput } from "@/components/ui";

type Resource = { id: string; title: string; kind: string; published: boolean };
export function ClassResourceManager({ classId, resources }: { classId: string; resources: Resource[] }) {
  const router = useRouter();
  const [kind, setKind] = useState("MATERIAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  async function send(form: FormData) {
    setBusy(true); setError(undefined); setSuccess(undefined);
    form.set("classId", classId);
    try {
      const response = await fetch("/api/admin/class-resources", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Resource update failed.");
      setSuccess("Changes saved."); router.refresh();
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Resource update failed."); return false; }
    finally { setBusy(false); }
  }
  async function action(resourceId: string, action: string) {
    if (action === "remove" && !window.confirm("Remove this resource? Participants will lose access.")) return;
    const data = new FormData(); data.set("resourceId", resourceId); data.set("action", action);
    await send(data);
  }
  return <section className="mt-10 rounded-2xl bg-white p-6 sm:p-8" aria-labelledby="resources-heading">
    <h2 id="resources-heading" className="display text-2xl text-[var(--forest)]">Materials and recordings</h2>
    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Optional. Add resources as drafts, then publish when ready. Only confirmed and partially refunded participants can access published resources from their account.</p>
    <FormNotice>{error}</FormNotice><FormNotice tone="success">{success}</FormNotice>
    <ul className="mt-5 divide-y divide-[var(--line)]">{resources.map(resource => <li key={resource.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div><a href={`/api/class-resources/${resource.id}`} target="_blank" rel="noreferrer" className="ink-link">{resource.title}</a><p className="mt-1 text-xs text-[var(--muted)]">{resource.kind === "MATERIAL" ? "PDF material" : "Recording link"} · {resource.published ? "Published" : "Draft"}</p></div>
      <div className="flex gap-4 text-sm"><button disabled={busy} type="button" className="ink-link" onClick={() => action(resource.id, resource.published ? "hide" : "publish")}>{resource.published ? "Unpublish" : "Publish"}</button><button disabled={busy} type="button" className="ink-link" onClick={() => action(resource.id, "remove")}>Remove</button></div>
    </li>)}</ul>
    <form className="mt-6 grid max-w-2xl gap-4" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); data.set("action", "add"); if (await send(data)) form.reset(); }}>
      <Field label="Resource title" required><TextInput name="title" maxLength={180} required /></Field>
      <Field label="Type"><select name="kind" value={kind} onChange={event => setKind(event.target.value)} className="focus-ring min-h-11 w-full rounded-xl bg-[var(--mist)] px-4 text-sm"><option value="MATERIAL">PDF material</option><option value="RECORDING">Recording link</option></select></Field>
      {kind === "MATERIAL" ? <Field label="PDF file (up to 5 MB)" required><input name="file" type="file" accept="application/pdf" required className="focus-ring w-full text-sm" /></Field> : <><Field label="Recording URL" required><TextInput name="recordingUrl" type="url" placeholder="https://" maxLength={2000} required /></Field><p className="text-xs leading-5 text-[var(--muted)]">Use your video host’s access controls to prevent link sharing. The academy protects access to the link, not playback on external services.</p></>}
      <div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add draft resource"}</Button></div>
    </form>
  </section>;
}
