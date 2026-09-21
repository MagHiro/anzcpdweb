"use client";
import { ConfirmForm } from "@/components/confirm-form";
import { MoneyInput } from "@/components/money-input";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveCategoryAction, archivePresenterAction, cancelClassAction, duplicateClassAction, archiveClassAction, publishClassAction, reorderCategoriesAction, saveCategoryAction, saveClassAction, saveClassSourcesAction, savePresenterAction, saveSourceReferenceAction, unpublishClassAction, type AdminActionState } from "@/server/actions/admin";
import { Field, FormNotice, Select, TextArea, TextInput, Button } from "@/components/ui";
import { toDateTimeLocalValue } from "@/lib/date";
import type { categories, classes, presenters, sourceReferences } from "@/db/schema";

const initial: AdminActionState = { ok: false };

type CategoryRecord = typeof categories.$inferSelect;
type ClassRecord = typeof classes.$inferSelect;
type PresenterRecord = typeof presenters.$inferSelect;
type SourceReferenceRecord = typeof sourceReferences.$inferSelect;

function useAdminAction(action: (formData: FormData) => Promise<AdminActionState>) {
  return useActionState(async (_state: AdminActionState, formData: FormData) => action(formData), initial);
}

export function CategoryForm({ category }: { category?: CategoryRecord }) {
  const router = useRouter();
  const [state, action, pending] = useAdminAction(saveCategoryAction);
  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);
  return <form action={action} className="grid gap-5 sm:grid-cols-2"><input type="hidden" name="id" value={category?.id ?? ""} /><FormNotice tone={state.ok ? "success" : "error"} className="sm:col-span-2">{state.message}</FormNotice><Field label="Country" required><Select name="country" defaultValue={category?.country ?? "AU"}><option value="AU">Australia</option><option value="NZ">New Zealand</option></Select></Field><Field label="Name" required error={state.fieldErrors?.name}><TextInput name="name" defaultValue={category?.name} required /></Field><Field label="Slug" hint="Unique within the country." required error={state.fieldErrors?.slug}><TextInput name="slug" defaultValue={category?.slug} required /></Field><Field label="Short description"><TextInput name="shortDescription" defaultValue={category?.shortDescription ?? ""} maxLength={280} /></Field><Field label="Visibility" required><Select name="visibility" defaultValue={category?.visibility ?? "VISIBLE"}><option value="VISIBLE">Visible</option><option value="HIDDEN">Hidden</option></Select></Field><Field label="Active" required><Select name="isActive" defaultValue={String(category?.isActive ?? true)}><option value="true">Active</option><option value="false">Inactive</option></Select></Field><Field label="Sort order" required><TextInput name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} required /></Field><div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : category ? "Save category" : "Create category"}</Button>{category ? <ArchiveCategoryButton /> : null}</div></form>;
}

export function PresenterForm({ presenter }: { presenter?: PresenterRecord }) {
  const [state, action, pending] = useAdminAction(savePresenterAction);
  useEffect(() => { if (state.ok) window.location.reload(); }, [state.ok]);
  return <form action={action} className="grid gap-5 sm:grid-cols-2"><input type="hidden" name="id" value={presenter?.id ?? ""} /><FormNotice tone={state.ok ? "success" : "error"} className="sm:col-span-2">{state.message}</FormNotice><Field label="Name" required error={state.fieldErrors?.name}><TextInput name="name" defaultValue={presenter?.name} placeholder="Full name" required /></Field><Field label="Slug" hint="Lowercase with hyphens." required error={state.fieldErrors?.slug}><TextInput name="slug" defaultValue={presenter?.slug} placeholder="full-name" required /></Field><Field label="Role" required error={state.fieldErrors?.role}><TextInput name="role" defaultValue={presenter?.role} placeholder="Registered migration agent and facilitator" required /></Field><Field label="Location" required error={state.fieldErrors?.location}><TextInput name="location" defaultValue={presenter?.location} placeholder="Sydney · Australia" required /></Field><Field label="Initials" hint="One to five letters or numbers." required error={state.fieldErrors?.initials}><TextInput name="initials" defaultValue={presenter?.initials} maxLength={5} required /></Field><Field label="Areas of focus" hint="Separate each item with a comma."><TextInput name="expertise" defaultValue={presenter?.expertise.join(", ")} placeholder="Professional obligations, Evidence strategy" /></Field><Field label="Bio" hint="Shown on the presenter profile and class pages." required error={state.fieldErrors?.bio} className="sm:col-span-2"><TextArea name="bio" defaultValue={presenter?.bio} className="min-h-36" required /></Field><div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : presenter ? "Save presenter" : "Create presenter"}</Button>{presenter ? <ArchivePresenterButton /> : null}</div></form>;
}

export function CategoryOrderingForm({ country, categories: initialCategories }: { country: "AU" | "NZ"; categories: Array<Pick<CategoryRecord, "id" | "name" | "sortOrder">> }) {
  const [items, setItems] = useState(() => [...initialCategories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)));
  const [state, action, pending] = useAdminAction(reorderCategoriesAction);
  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }
  return <form action={action} className="rounded-xl border border-[var(--line)] bg-white p-6"><input type="hidden" name="country" value={country} /><input type="hidden" name="categories" value={items.map((item) => item.id).join(",")} readOnly /><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-[var(--fern)]">Display order · {country}</p><h2 className="display mt-2 text-3xl text-[var(--forest)]">Arrange categories</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">This order is used wherever the country’s catalogue categories are listed.</p></div><Button type="submit" disabled={pending}>{pending ? "Saving…" : `Save ${country} order`}</Button></div><FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice><ol className="mt-5 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">{items.map((item, index) => <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3"><span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-[var(--forest)]"><span className="w-6 text-xs text-[var(--muted)]">{index + 1}</span><span className="truncate">{item.name}</span></span><span className="flex shrink-0 gap-2"><button type="button" className="focus-ring rounded-md border border-[var(--line)] px-2 py-1 text-sm disabled:opacity-40" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.name} up`}>↑</button><button type="button" className="focus-ring rounded-md border border-[var(--line)] px-2 py-1 text-sm disabled:opacity-40" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${item.name} down`}>↓</button></span></li>)}</ol></form>;
}

function checkedAtValue(value: Date | undefined) { return value ? new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(value) : new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date()); }

export function SourceReferenceForm({ source }: { source?: SourceReferenceRecord }) {
  const [state, action, pending] = useAdminAction(saveSourceReferenceAction);
  useEffect(() => { if (state.ok) window.location.reload(); }, [state.ok]);
  return <form action={action} className="grid gap-5 sm:grid-cols-2"><input type="hidden" name="id" value={source?.id ?? ""} /><FormNotice tone={state.ok ? "success" : "error"} className="sm:col-span-2">{state.message}</FormNotice><Field label="Authority" required error={state.fieldErrors?.authority}><TextInput name="authority" defaultValue={source?.authority} required /></Field><Field label="Title" required error={state.fieldErrors?.title}><TextInput name="title" defaultValue={source?.title} required /></Field><Field label="URL" required error={state.fieldErrors?.url}><TextInput name="url" type="url" defaultValue={source?.url} required /></Field><Field label="Jurisdiction" required><Select name="jurisdiction" defaultValue={source?.jurisdiction ?? "AU"}><option value="AU">Australia</option><option value="NZ">New Zealand</option></Select></Field><Field label="Date checked" hint="When the editorial team last checked the source." required error={state.fieldErrors?.checkedAt}><TextInput name="checkedAt" type="date" defaultValue={checkedAtValue(source?.checkedAt)} required /></Field><Field label="Notes" className="sm:col-span-2"><TextArea name="notes" defaultValue={source?.notes ?? ""} /></Field><div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : source ? "Save source reference" : "Add source reference"}</Button></div></form>;
}

export function ClassSourceReferenceForm({ classId, sources, selectedIds }: { classId: string; sources: SourceReferenceRecord[]; selectedIds: string[] }) {
  const [state, action, pending] = useAdminAction(saveClassSourcesAction);
  return <form action={action} className="mt-5 space-y-4"><input type="hidden" name="classId" value={classId} /><FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice>{sources.length ? <div className="grid gap-3">{sources.map((source) => <label key={source.id} className="flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--mist)] p-4 text-sm"><input className="mt-1 h-4 w-4 accent-[var(--forest)]" type="checkbox" name="sourceIds" value={source.id} defaultChecked={selectedIds.includes(source.id)} /><span><strong className="text-[var(--forest)]">{source.title}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{source.authority} · checked {checkedAtValue(source.checkedAt)}</span></span></label>)}</div> : <p className="text-sm text-[var(--muted)]">Create a source reference first.</p>}<Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save attached references"}</Button></form>;
}

function ArchiveCategoryButton() { const [state, action, pending] = useAdminAction(archiveCategoryAction); return <><button disabled={pending} type="submit" formAction={action} onClick={(event) => { if (!window.confirm("Archive this category? Existing classes and historical bookings will remain intact.")) event.preventDefault(); }} className="focus-ring rounded-lg border border-[#e8bbb6] px-4 py-2.5 text-sm font-bold text-[var(--error)]">{pending ? "…" : "Archive"}</button>{state.message ? <span className="mt-2 block max-w-sm text-xs" role="status">{state.message}</span> : null}</>; }

function ArchivePresenterButton() { const [state, action, pending] = useAdminAction(archivePresenterAction); return <><button disabled={pending} type="submit" formAction={action} onClick={(event) => { if (!window.confirm("Archive this presenter? Existing class assignments will remain intact.")) event.preventDefault(); }} className="focus-ring rounded-lg border border-[#e8bbb6] px-4 py-2.5 text-sm font-bold text-[var(--error)]">{pending ? "…" : "Archive"}</button>{state.message ? <span className="sr-only" role="status">{state.message}</span> : null}</>; }

function defaultDate(record: ClassRecord | undefined, key: "startAt" | "endAt" | "bookingOpensAt" | "bookingClosesAt", timezone: string) { return record ? toDateTimeLocalValue(record[key], timezone) : ""; }

export function AdminClassForm({ classRecord, categories, presenters: presenterOptions = [], onSaved }: { classRecord?: ClassRecord; categories: CategoryRecord[]; presenters?: PresenterRecord[]; onSaved?: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useAdminAction(saveClassAction);
  const [country, setCountry] = useState<"AU" | "NZ">(classRecord?.country ?? "AU");
  const timezone = classRecord?.timezone ?? "Australia/Sydney";
  const currentActivity = classRecord?.cpdActivityCategory ?? "";

  useEffect(() => {
    if (!state.ok || !state.id) return;
    if (!classRecord) {
      router.push(`/admin/classes/${state.id}`);
    } else if (onSaved) {
      onSaved();
    } else {
      window.location.reload();
    }
  }, [state.ok, state.id, classRecord, onSaved, router]);

  return <form action={action} className="space-y-6"><nav aria-label="Class editor sections" className="flex flex-wrap gap-2 rounded-lg border border-[var(--line)] bg-white p-3">{["Basics", "Schedule", "Capacity", "Pricing", "Media"].map((label, index) => <a key={label} href={`#editor-${index}`} className="rounded-md px-3 py-2 text-xs font-semibold hover:bg-[var(--mist)]">{label}</a>)}</nav><input type="hidden" name="id" value={classRecord?.id ?? ""} /><FormNotice tone={state.ok ? "success" : "error"} className="mb-1">{state.message}</FormNotice>
    <section id="editor-0" className="rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6"><p className="eyebrow text-[var(--fern)]">Basic information</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Title" required error={state.fieldErrors?.title}><TextInput name="title" defaultValue={classRecord?.title} required /></Field>
      <Field label="Slug" hint="Lowercase with hyphens." required error={state.fieldErrors?.slug}><TextInput name="slug" defaultValue={classRecord?.slug} required /></Field>
      <Field label="Country" hint="This controls which categories are available." required><Select name="country" value={country} onChange={(event) => setCountry(event.target.value as "AU" | "NZ")}><option value="AU">Australia</option><option value="NZ">New Zealand</option></Select></Field>
      <Field label="Category" required error={state.fieldErrors?.categoryId}><Select name="categoryId" defaultValue={classRecord?.categoryId ?? ""} required><option value="">Select category</option>{categories.filter((category) => category.country === country).map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive && category.visibility === "VISIBLE" ? "" : " (archived)"}</option>)}</Select></Field>
      <Field label="Presenter" hint="Optional. Assign one presenter to this class."><Select name="presenterId" defaultValue={classRecord?.presenterId ?? ""}><option value="">No presenter assigned</option>{presenterOptions.map((presenter) => <option key={presenter.id} value={presenter.id}>{presenter.name}{presenter.isActive ? "" : " (archived)"}</option>)}</Select></Field>
      <Field label="Short description" required error={state.fieldErrors?.shortDescription} className="sm:col-span-2"><TextArea name="shortDescription" defaultValue={classRecord?.shortDescription} className="min-h-24" required /></Field>
      <Field label="Full description" hint="Plain text is rendered safely. Avoid copying large third-party source passages." required error={state.fieldErrors?.fullDescription} className="sm:col-span-2"><TextArea name="fullDescription" defaultValue={classRecord?.fullDescription} required className="min-h-40" /></Field>
    </div></section>
    <section id="editor-1" className="rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6"><p className="eyebrow text-[var(--fern)]">Schedule and delivery</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Timezone" required><Select name="timezone" defaultValue={timezone}><option>Australia/Sydney</option><option>Australia/Melbourne</option><option>Australia/Brisbane</option><option>Australia/Adelaide</option><option>Australia/Perth</option><option>Pacific/Auckland</option></Select></Field>
      <Field label="Delivery format" required><Select name="deliveryFormat" defaultValue={classRecord?.deliveryFormat ?? "ONLINE"}><option value="ONLINE">Online</option><option value="IN_PERSON">In person</option><option value="HYBRID">Hybrid</option></Select></Field>
      <Field label="Start" hint="Entered in the selected class timezone." required error={state.fieldErrors?.startAt}><TextInput name="startAt" type="datetime-local" defaultValue={defaultDate(classRecord, "startAt", timezone)} required /></Field>
      <Field label="End" required error={state.fieldErrors?.endAt}><TextInput name="endAt" type="datetime-local" defaultValue={defaultDate(classRecord, "endAt", timezone)} required /></Field>
      <Field label="Venue name"><TextInput name="venueName" defaultValue={classRecord?.venueName ?? ""} /></Field>
      <Field label="Venue address"><TextArea name="venueAddress" defaultValue={classRecord?.venueAddress ?? ""} className="min-h-24" /></Field>
      <Field label="Online attendance information" className="sm:col-span-2"><TextArea name="onlineAttendanceInfo" defaultValue={classRecord?.onlineAttendanceInfo ?? ""} className="min-h-24" /></Field>
    </div></section>
    <section id="editor-2" className="rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6"><p className="eyebrow text-[var(--fern)]">Capacity and CPD</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Seat capacity" hint="Leave blank only when unlimited." error={state.fieldErrors?.seatCapacity}><TextInput name="seatCapacity" type="number" min={1} defaultValue={classRecord?.seatCapacity ?? ""} /></Field>
      <Field label="Capacity model" required><Select name="unlimitedCapacity" defaultValue={String(classRecord?.unlimitedCapacity ?? false)}><option value="false">Capacity controlled</option><option value="true">Unlimited capacity</option></Select></Field>
      <Field label="CPD unit type" required><Select name="cpdUnitType" defaultValue={classRecord?.cpdUnitType ?? "NONE"}><option value="NONE">None specified</option><option value="POINTS">Points</option><option value="HOURS">Hours</option><option value="CUSTOM">Custom</option></Select></Field>
      <Field label="CPD amount" hint="Use points for Australia or hours for New Zealand where supplied." error={state.fieldErrors?.cpdUnitAmount}><TextInput name="cpdUnitAmount" type="number" step="0.25" min={0} defaultValue={classRecord?.cpdUnitAmount ?? ""} /></Field>
      <Field label="Legislation category / activity type" hint="Use the activity type recorded by the provider."><TextInput name="cpdActivityCategory" defaultValue={currentActivity} maxLength={120} /></Field>
      <Field label="Professional identifier required" required><Select name="professionalIdentifierRequired" defaultValue={String(classRecord?.professionalIdentifierRequired ?? false)}><option value="false">No</option><option value="true">Yes</option></Select></Field>
    </div></section>
    <section id="editor-3" className="rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6"><p className="eyebrow text-[var(--fern)]">Pricing and booking window</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Price" hint="Enter the full currency amount, for example 195.00. Currency is selected alongside." required><MoneyInput name="priceMinorUnits" defaultMinor={classRecord?.priceMinorUnits ?? 0} required /></Field>
      <Field label="Currency" required><Select name="currency" defaultValue={classRecord?.currency ?? "AUD"}><option value="AUD">AUD</option><option value="NZD">NZD</option></Select></Field>
      <Field label="Booking opens" required><TextInput name="bookingOpensAt" type="datetime-local" defaultValue={defaultDate(classRecord, "bookingOpensAt", timezone)} required /></Field>
      <Field label="Booking closes" required><TextInput name="bookingClosesAt" type="datetime-local" defaultValue={defaultDate(classRecord, "bookingClosesAt", timezone)} required /></Field>
    </div></section>
    <section id="editor-4" className="rounded-xl border border-[var(--line)] bg-white p-5 sm:p-6"><p className="eyebrow text-[var(--fern)]">Media and search</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Media alt text"><TextInput name="mediaAltText" defaultValue={classRecord?.mediaAltText ?? ""} /></Field>
      <Field label="SEO title"><TextInput name="seoTitle" defaultValue={classRecord?.seoTitle ?? ""} /></Field>
      <Field label="SEO description" className="sm:col-span-2"><TextArea name="seoDescription" defaultValue={classRecord?.seoDescription ?? ""} /></Field>
      {classRecord ? <div className="sm:col-span-2"><MediaUpload classId={classRecord.id} /></div> : <p className="text-sm text-[var(--muted)] sm:col-span-2">Save the class before adding media.</p>}
    </div></section>
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-4 shadow-lg"><p className="text-xs text-[var(--muted)]">Saving details does not publish the class. Review source references before publishing.</p><Button type="submit" disabled={pending}>{pending ? "Saving…" : classRecord ? "Save changes" : "Create draft"}</Button></div>
  </form>;
}

function MediaUpload({ classId }: { classId: string }) { const fileRef = useRef<HTMLInputElement>(null); const [altText, setAltText] = useState(""); const [message, setMessage] = useState<string>(); const [pending, setPending] = useState(false); async function upload() { const file = fileRef.current?.files?.[0]; if (!file || !altText.trim()) { setMessage("Choose an image and add accessible alt text."); return; } setPending(true); setMessage(undefined); const body = new FormData(); body.append("classId", classId); body.append("file", file); body.append("altText", altText.trim()); try { const response = await fetch("/api/admin/media", { method: "POST", body }); if (!response.ok) { const result = await response.json().catch(() => null) as { error?: string } | null; setMessage(result?.error ?? "Image upload failed. No class data was changed."); return; } window.location.assign(response.url); } catch { setMessage("Image upload failed. Check your connection and try again."); } finally { setPending(false); } } return <div className="rounded-xl bg-[var(--mist)] p-4"><p className="text-sm font-bold text-[var(--forest)]">Featured image</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Images are validated server-side and stored in public/assets for direct public delivery.</p><div className="mt-3 flex flex-wrap gap-3"><input aria-label="Featured image file" ref={fileRef} className="focus-ring min-h-10 max-w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs" type="file" accept="image/png,image/jpeg,image/webp" /><input aria-label="Image description" value={altText} onChange={(event) => setAltText(event.target.value)} className="focus-ring min-h-10 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs" placeholder="Accessible image description" /><button className="focus-ring min-h-10 rounded-lg bg-[var(--forest)] px-4 text-xs font-bold text-white disabled:opacity-60" type="button" onClick={upload} disabled={pending}>{pending ? "Uploading…" : "Upload image"}</button></div>{message ? <p className="mt-3 text-sm text-[var(--error)]" role="alert">{message}</p> : null}</div>; }

export function AdminClassActions({ classRecord }: { classRecord: ClassRecord }) { return <div className="flex flex-wrap gap-2"><ActionForm action={classRecord.status === "PUBLISHED" ? unpublishClassAction : publishClassAction} id={classRecord.id} label={classRecord.status === "PUBLISHED" ? "Unpublish" : "Publish"} /><ActionForm action={duplicateClassAction} id={classRecord.id} label="Duplicate" variant="secondary" /><ActionForm action={cancelClassAction} id={classRecord.id} label="Cancel class" variant="danger" confirmMessage="Cancel this class? Existing bookings will remain in place for an explicit review and refund workflow." /><ActionForm action={archiveClassAction} id={classRecord.id} label="Archive" variant="secondary" confirmMessage="Archive this class? Historical bookings will remain intact." /></div>; }

function ActionForm({ action, id, label, variant = "primary", confirmMessage }: { action: (formData: FormData) => Promise<AdminActionState>; id: string; label: string; variant?: "primary" | "secondary" | "danger"; confirmMessage?: string }) { const [state, formAction, pending] = useAdminAction(action); return <ConfirmForm action={formAction} message={confirmMessage}><input type="hidden" name="id" value={id} /><button type="submit" disabled={pending} className={`focus-ring min-h-10 rounded-full px-4 text-xs font-bold ${variant === "primary" ? "bg-[var(--forest)] text-white" : variant === "danger" ? "border border-[#e8bbb6] text-[var(--error)]" : "border border-[var(--line)] text-[var(--forest)]"}`}>{pending ? "…" : label}</button>{state.message ? <span className="sr-only" role="status">{state.message}</span> : null}</ConfirmForm>; }
