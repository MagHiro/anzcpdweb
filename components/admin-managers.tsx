"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminModal } from "@/components/admin-modal";
import { CategoryForm, CategoryOrderingForm, PresenterForm } from "@/components/admin-forms";
import { Button, StatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { categories, classes, presenters } from "@/db/schema";

type CategoryRecord = typeof categories.$inferSelect;
type ClassRecord = typeof classes.$inferSelect;
type PresenterRecord = typeof presenters.$inferSelect;

type CategoryRow = { category: CategoryRecord; countryName: string; classCount: number };
type PresenterRow = { presenter: PresenterRecord; classCount: number };
type ClassRow = { class: ClassRecord; categoryName: string; presenterName: string | null };

export function CategoryManager({ rows }: { rows: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRecord | "new" | null>(null);
  const australia = rows.filter((row) => row.category.country === "AU").map((row) => row.category);
  const newZealand = rows.filter((row) => row.category.country === "NZ").map((row) => row.category);

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[var(--fern)]">Taxonomy</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Categories</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Country-specific categories remain historical references for classes and bookings. Edit one category at a time in the focused editor.</p></div><Button type="button" onClick={() => setEditing("new")}>New category</Button></div>
    <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-[var(--line)] text-xs uppercase tracking-[.1em] text-[var(--muted)]"><tr><th scope="col" className="px-5 py-4">Name</th><th scope="col" className="px-5 py-4">Country</th><th scope="col" className="px-5 py-4">Classes</th><th scope="col" className="px-5 py-4">Visibility</th><th scope="col" className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{rows.map((row) => <tr key={row.category.id}><td data-label="Name" className="px-5 py-4 font-semibold text-[var(--forest)]">{row.category.name}<span className="block text-xs font-normal text-[var(--muted)]">/{row.category.slug}</span></td><td data-label="Country" className="px-5 py-4">{row.countryName}</td><td data-label="Classes" className="px-5 py-4">{row.classCount}</td><td data-label="Visibility" className="px-5 py-4"><StatusBadge status={row.category.isActive ? row.category.visibility : "ARCHIVED"} /></td><td data-label="Action" className="px-5 py-4 text-right"><button type="button" className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--forest)] hover:bg-[var(--mist)]" onClick={() => setEditing(row.category)}>Edit</button></td></tr>)}</tbody></table></div>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">{australia.length ? <CategoryOrderingForm country="AU" categories={australia} /> : null}{newZealand.length ? <CategoryOrderingForm country="NZ" categories={newZealand} /> : null}</div>
    <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "Add a category" : `Edit ${editing?.name ?? "category"}`} description="Keep the country, slug and visibility together so class filters stay predictable." size="medium">{editing === "new" ? <CategoryForm /> : editing ? <CategoryForm key={editing.id} category={editing} /> : null}</AdminModal>
  </>;
}

export function PresenterManager({ rows }: { rows: PresenterRow[] }) {
  const [editing, setEditing] = useState<PresenterRecord | "new" | null>(null);

  return <>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[var(--fern)]">People and faculty</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Presenters</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Manage presenter profiles once, then assign them to individual classes from the class editor.</p></div><Button type="button" onClick={() => setEditing("new")}>New presenter</Button></div>
    <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b border-[var(--line)] text-xs uppercase tracking-[.1em] text-[var(--muted)]"><tr><th scope="col" className="px-5 py-4">Presenter</th><th scope="col" className="px-5 py-4">Role</th><th scope="col" className="px-5 py-4">Location</th><th scope="col" className="px-5 py-4">Assigned classes</th><th scope="col" className="px-5 py-4">Status</th><th scope="col" className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{rows.map((row) => <tr key={row.presenter.id}><td data-label="Presenter" className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-xs font-black text-white">{row.presenter.initials}</span><span><strong className="block text-[var(--forest)]">{row.presenter.name}</strong><span className="text-xs text-[var(--muted)]">/{row.presenter.slug}</span></span></div></td><td data-label="Role" className="px-5 py-4">{row.presenter.role}</td><td data-label="Location" className="px-5 py-4">{row.presenter.location}</td><td data-label="Assigned classes" className="px-5 py-4">{row.classCount}</td><td data-label="Status" className="px-5 py-4"><StatusBadge status={row.presenter.isActive ? "ACTIVE" : "ARCHIVED"} /></td><td data-label="Action" className="px-5 py-4 text-right"><button type="button" className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--forest)] hover:bg-[var(--mist)]" onClick={() => setEditing(row.presenter)}>Edit</button></td></tr>)}</tbody></table>{!rows.length ? <p className="p-10 text-center text-sm text-[var(--muted)]">No presenters yet. Add the first presenter to make them available on class records.</p> : null}</div>
    <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "Add a presenter" : `Edit ${editing?.name ?? "presenter"}`} description="This profile is reused on public presenter pages and any classes assigned to the presenter." size="medium">{editing === "new" ? <PresenterForm /> : editing ? <PresenterForm key={editing.id} presenter={editing} /> : null}</AdminModal>
  </>;
}

export function ClassManager({ rows }: { rows: ClassRow[]; categories: CategoryRecord[]; presenters: PresenterRecord[] }) {
  const router = useRouter();

  return <>
    <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="border-b border-[var(--line)] text-xs uppercase tracking-[.1em] text-[var(--muted)]"><tr><th scope="col" className="px-5 py-4">Class</th><th scope="col" className="px-5 py-4">Schedule</th><th scope="col" className="px-5 py-4">Presenter</th><th scope="col" className="px-5 py-4">Activity type</th><th scope="col" className="px-5 py-4">Price</th><th scope="col" className="px-5 py-4">Status</th><th scope="col" className="px-5 py-4">Capacity</th><th scope="col" className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{rows.map((row) => <tr key={row.class.id}><td data-label="Class" className="px-5 py-4"><Link href={`/admin/classes/${row.class.id}`} className="font-bold text-[var(--forest)] underline underline-offset-4">{row.class.title}</Link><span className="block text-xs text-[var(--muted)]">{row.categoryName} · {row.class.country}</span></td><td data-label="Schedule" className="px-5 py-4 text-xs">{formatDateTime(row.class.startAt, row.class.timezone)}<span className="block text-[var(--muted)]">{row.class.timezone}</span></td><td data-label="Presenter" className="px-5 py-4">{row.presenterName ?? <span className="text-[var(--muted)]">Not assigned</span>}</td><td data-label="Activity type" className="px-5 py-4">{row.class.cpdActivityCategory ?? <span className="text-[var(--muted)]">Not set</span>}</td><td data-label="Price" className="px-5 py-4">{formatMoney(row.class.priceMinorUnits, row.class.currency)}</td><td data-label="Status" className="px-5 py-4"><StatusBadge status={row.class.status} /></td><td data-label="Capacity" className="px-5 py-4">{row.class.unlimitedCapacity ? "Unlimited" : row.class.seatCapacity}</td><td data-label="Action" className="px-5 py-4 text-right"><button type="button" className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--forest)] hover:bg-[var(--mist)]" onClick={() => router.push(`/admin/classes/${row.class.id}`)}>Edit</button></td></tr>)}</tbody></table>{!rows.length ? <p className="p-10 text-center text-sm text-[var(--muted)]">No classes found.</p> : null}</div>

  </>;
}
