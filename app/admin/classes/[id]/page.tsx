import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBookingRows, getAdminClassById, getClassSourceOptions, getCategories, getPresenters } from "@/server/catalogue/queries";
import { AdminClassActions, AdminClassForm } from "@/components/admin-forms";
import { StatusBadge } from "@/components/ui";
import { uuidSchema } from "@/lib/validation";

export default async function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getAdminClassById(id);
  if (!row) notFound();
  const [categories, presenters, sourceOptions, affectedBookings] = await Promise.all([
    getCategories(undefined, true), getPresenters(true), getClassSourceOptions(id, row.class.country),
    getAdminBookingRows({ classId: id, page: 1, pageSize: 20 }),
  ]);
  const { sources, selectedIds } = sourceOptions;
  return <div className="class-detail-editor">
    <Link href="/admin/classes" className="class-back-link focus-ring">← All classes</Link>
    <header className="class-editor-heading">
      <div className="min-w-0"><h1 className="display">{row.class.title}</h1><div className="class-editor-meta"><StatusBadge status={row.class.status} /><span>{row.class.country === "AU" ? "Australia" : "New Zealand"} · {row.categoryName}</span></div></div>
      <div className="class-editor-actions"><AdminClassActions classRecord={row.class} /></div>
    </header>
    {affectedBookings.length > 0 && <aside className="class-booking-notice" aria-label="Affected bookings">
      <p>Status changes do not automatically refund attendees. Review bookings and use the refund workflow where needed.</p>
      <Link href={`/admin/bookings?classId=${encodeURIComponent(id)}`} className="focus-ring">Review {affectedBookings.length === 20 ? "bookings" : `${affectedBookings.length} booking${affectedBookings.length === 1 ? "" : "s"}`} →</Link>
    </aside>}
    <AdminClassForm classRecord={row.class} categories={categories} presenters={presenters} sources={sources} selectedSourceIds={selectedIds} />
  </div>;
}
