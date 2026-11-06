import Link from "next/link";
import { notFound } from "next/navigation";
import { uuidSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import { getAdminClassById } from "@/server/catalogue/queries";
import { getClassResources } from "@/server/bookings/resources";
import { AdminClassNav } from "@/components/admin-class-nav";
import { ClassResourceManager } from "@/components/class-resource-manager";

export default async function ClassResourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getAdminClassById(id);
  if (!row) notFound();
  const resources = await getClassResources(id);
  return <div>
    <Link href="/admin/classes" className="ink-link">← All classes</Link>
    <h1 className="display mt-6 text-4xl text-[var(--forest)]">{row.class.title}</h1>
    <p className="mt-3 text-sm text-[var(--muted)]">{formatDateTime(row.class.startAt, row.class.timezone)} · {row.class.timezone}</p>
    <AdminClassNav classId={id} current="resources" />
    <ClassResourceManager classId={id} resources={resources.map(({ id, title, kind, published }) => ({ id, title, kind, published }))} />
  </div>;
}
