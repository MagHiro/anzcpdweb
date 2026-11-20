"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, FormNotice, TextInput } from "@/components/ui";
import { RecordingPlayer } from "@/components/recording-player";

type Resource = { id: string; title: string; kind: string; published: boolean; objectKey?: string | null };
export function ClassResourceManager({ classId, resources }: { classId: string; resources: Resource[] }) {
  const router = useRouter();
  const [kind, setKind] = useState("MATERIAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [progress, setProgress] = useState<number>();
  async function uploadRecording(data: FormData) {
    const file = data.get("file");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024 * 1024) { setError("Choose an MP4 video up to 2 GB."); return false; }
    setBusy(true); setError(undefined); setSuccess(undefined); setProgress(0);
    try {
      const created = await fetch("/api/admin/recordings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classId, title: data.get("title") }) });
      const resource = await created.json();
      if (!created.ok) throw new Error(resource.error ?? "Recording could not be created.");
      const chunkSize = 8 * 1024 * 1024;
      for (let offset = 0; offset < file.size; offset += chunkSize) {
        const response = await fetch(`/api/admin/recordings?id=${resource.id}`, { method: "PUT", headers: { "content-type": "application/octet-stream", "x-upload-offset": String(offset), "x-upload-total": String(file.size) }, body: file.slice(offset, offset + chunkSize) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Upload failed. Remove the incomplete draft and try again.");
        setProgress(Math.round(Math.min(offset + chunkSize, file.size) / file.size * 100));
      }
      setSuccess("Recording uploaded. Publish it when ready.");
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Recording upload failed."); return false; }
    finally { setBusy(false); setProgress(undefined); router.refresh(); }
  }
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
  return <section className="class-resource-panel mt-6 rounded-2xl bg-white p-6 sm:p-8" aria-labelledby="resources-heading">
    <h2 id="resources-heading" className="display text-2xl text-[var(--forest)]">Materials and recordings</h2>
    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Upload resources, then publish them to enable participant access and sharing emails.</p>
    <FormNotice>{error}</FormNotice><FormNotice tone="success">{success}</FormNotice>
    <ul className="mt-5 divide-y divide-[var(--line)]">{resources.map(resource => <li key={resource.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className={resource.kind === "RECORDING" && resource.objectKey ? "w-full" : undefined}><a href={`/api/class-resources/${resource.id}`} target="_blank" rel="noreferrer" className="ink-link">{resource.title}</a><p className="mt-1 text-xs text-[var(--muted)]">{resource.kind === "MATERIAL" ? "PDF material" : resource.objectKey ? "Uploaded recording" : "Recording link"} · {resource.published ? "Published" : "Draft"}</p>{resource.kind === "RECORDING" && resource.objectKey && <RecordingPlayer id={resource.id} title={resource.title} />}</div>
      <div className="flex flex-wrap gap-2 text-sm"><Button disabled={busy} type="button" variant="secondary" size="sm" onClick={() => action(resource.id, resource.published ? "hide" : "publish")}>{resource.published ? "Unpublish" : "Publish"}</Button><Button disabled={busy} type="button" variant="quiet" size="sm" onClick={() => action(resource.id, "remove")}>Remove</Button></div>
    </li>)}</ul>
    <form className="resource-upload-form mt-6 grid gap-4" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); data.set("action", "add"); if (await (kind === "UPLOAD" ? uploadRecording(data) : send(data))) form.reset(); }}>
      <Field label="Resource title" required><TextInput name="title" maxLength={180} required /></Field>
      <Field label="Type"><select name="kind" disabled={busy} value={kind} onChange={event => setKind(event.target.value)} className="focus-ring min-h-11 w-full rounded-xl bg-[var(--mist)] px-4 text-sm"><option value="MATERIAL">PDF material</option><option value="UPLOAD">Upload recording</option><option value="RECORDING">Recording link</option></select></Field>
      {kind === "MATERIAL" ? <Field label="PDF file (up to 5 MB)" required><input name="file" type="file" accept="application/pdf" required className="focus-ring w-full text-sm" /></Field> : kind === "UPLOAD" ? <><Field label="MP4 recording (up to 2 GB)" required><input name="file" type="file" accept="video/mp4,.mp4" required disabled={busy} className="focus-ring w-full text-sm" /></Field><p className="text-xs leading-5 text-[var(--muted)]">Use an H.264/AAC MP4 for browser playback. Access is restricted to eligible participants; download controls are hidden, but screen capture cannot be prevented.</p></> : <><Field label="Recording URL" required><TextInput name="recordingUrl" type="url" placeholder="https://" maxLength={2000} required /></Field><p className="text-xs leading-5 text-[var(--muted)]">Use your video host’s access controls to prevent link sharing. The academy protects access to the link, not playback on external services.</p></>}
      {progress !== undefined && <div role="status" className="text-sm text-[var(--muted)]">Uploading recording… {progress}%<progress value={progress} max={100} aria-label="Recording upload" className="mt-2 block w-full" /></div>}
      <div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add draft resource"}</Button></div>
    </form>
  </section>;
}
