"use client";
import { useState } from "react";
import type { sourceReferences } from "@/db/schema";
import { AdminModal } from "@/components/admin-modal";
import { SourceReferenceForm } from "@/components/admin-forms";
import { Button, EmptyState, FormNotice } from "@/components/ui";
import { ArrowUpRight } from "@/components/icon";
import { deleteSourceReferenceAction } from "@/server/actions/admin";
import { useAdminFeedback } from "@/components/admin-feedback";
type Source = typeof sourceReferences.$inferSelect;

export function SourceManager({ rows }: { rows: Source[] }) {
  const notify = useAdminFeedback();
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
      if (result.ok) { notify?.("Source reference deleted.", "success"); setDeleting(null); setEditing(null); }
      else setError(result.message ?? "Source reference could not be deleted.");
    } catch { setError("Source reference could not be deleted. Please try again."); }
    finally { setPending(false); }
  }
  function confirmDelete(source: Source) { setEditing(null); setError(""); setDeleting(source); }
  return <>
    <div className="admin-page-heading"><h1 className="display">Source references</h1><Button onClick={() => setEditing("new")}>New reference</Button></div>
    <div className="admin-source-list mt-8">
      {rows.map(source => <article key={source.id} className="admin-source-row">
        <div className="admin-source-content"><h2><a href={source.url} target="_blank" rel="noreferrer" className="focus-ring">{source.title}<ArrowUpRight size={18} className="shrink-0" /><span className="sr-only"> (opens in a new tab)</span></a></h2><p>{source.authority}</p></div>
        <div className="admin-source-meta"><span>{source.jurisdiction === "AU" ? "Australia" : "New Zealand"}</span><span>Checked <time dateTime={source.checkedAt.toISOString().slice(0, 10)}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: "UTC" }).format(source.checkedAt)}</time></span></div>
        <div className="admin-source-actions"><Button variant="secondary" size="sm" aria-label={`Edit reference: ${source.title}`} onClick={() => setEditing(source)}>Edit</Button><Button variant="secondary" size="sm" aria-label={`Delete reference: ${source.title}`} onClick={() => confirmDelete(source)}>Delete</Button></div>
      </article>)}
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
