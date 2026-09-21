import { getCategories, getPresenters } from "@/server/catalogue/queries";
import { AdminClassForm } from "@/components/admin-forms";

export default async function NewAdminClassPage() { const [categories, presenters] = await Promise.all([getCategories(), getPresenters()]); return <div><p className="eyebrow text-[var(--fern)]">Catalogue</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Create a class</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">New records begin as drafts. The publish check verifies country/currency, schedule, delivery details and required production copy.</p><div className="mt-8"><AdminClassForm categories={categories} presenters={presenters} /></div></div>; }
