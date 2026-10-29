"use client";
import { useState } from "react";
import type { sourceReferences } from "@/db/schema";
import { AdminModal } from "@/components/admin-modal";
import { SourceReferenceForm } from "@/components/admin-forms";
import { Button, CountryBadge, EmptyState, FormNotice } from "@/components/ui";
import { deleteSourceReferenceAction } from "@/server/actions/admin";
type Source = typeof sourceReferences.$inferSelect;

export function SourceManager({ rows }: { rows: Source[] }) {
  const [editing, setEditing] = useState<Source | "new" | null>(null);
  const [deleting, setDeleting] = useState<Source | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function deleteReference() {
    if (!deleting || pending) return;
    setPending(true);
    setError("");
    try {
      const data = new FormData();
      data.set("id", deleting.id);
      const result = await deleteSourceReferenceAction(data);
      if (result.ok) { setDeleting(null); setEditing(null); }
      else setError(result.message ?? "Source reference could not be deleted.");
    } catch { setError("Source reference could not be deleted. Please try again."); }
    finally { setPending(false); }
  }
  function confirmDelete(source: Source) { setEditing(null); setError(""); setDeleting(source); }
  return <>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="display text-4xl">Source references</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">Maintain the sources behind the catalogue. References support traceability, not accreditation or endorsement.</p></div><Button onClick={() => setEditing("new")}>New reference</Button></div>
    <div className="mt-8 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      {rows.map(source => <article key={source.id} className="flex flex-wrap items-center justify-between gap-5 p-5"><div className="min-w-0 flex-1"><CountryBadge country={source.jurisdiction} /><h2 className="mt-3 text-sm font-semibold"><a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{source.title} ↗</a></h2><p className="mt-2 text-xs text-[var(--muted)]">{source.authority} · Checked {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: "UTC" }).format(source.checkedAt)}</p></div><div className="flex gap-3"><Button variant="secondary" size="sm" onClick={() => setEditing(source)}>Edit</Button><Button variant="secondary" size="sm" onClick={() => confirmDelete(source)}>Delete</Button></div></article>)}
      {!rows.length && <EmptyState title="Add your first reference" description="Keep the authority, source URL and last-checked date together, then attach the reference to a class." />}
    </div>
    <AdminModal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a source reference" : "Edit source reference"} size="medium">
      {editing && <><SourceReferenceForm key={editing === "new" ? "new" : editing.id} source={editing === "new" ? undefined : editing} />{editing !== "new" && <div className="mt-6 border-t border-[var(--line)] pt-5"><Button variant="secondary" onClick={() => confirmDelete(editing)}>Delete reference</Button></div>}</>}
    </AdminModal>
    <AdminModal open={deleting !== null} onClose={() => { if (!pending) setDeleting(null); }} title="Delete source reference?" size="medium">
      <p className="text-sm leading-7">Permanently delete “{deleting?.title}”? This cannot be undone. References attached to a class cannot be deleted.</p>
      <FormNotice tone="error">{error}</FormNotice>
      <div className="mt-6 flex flex-wrap gap-3"><Button disabled={pending} onClick={deleteReference}>{pending ? "Deleting…" : "Delete reference"}</Button><Button variant="secondary" disabled={pending} onClick={() => setDeleting(null)}>Cancel</Button></div>
    </AdminModal>
  </>;
}
