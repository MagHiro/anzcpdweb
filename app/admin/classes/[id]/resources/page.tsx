import Link from "next/link";
import { notFound } from "next/navigation";
import { uuidSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import { getAdminClassById } from "@/server/catalogue/queries";
import { getClassResources } from "@/server/bookings/resources";
import { AdminClassNav } from "@/components/admin-class-nav";
import { ClassResourceManager } from "@/components/class-resource-manager";
import { AdminResourceEmail } from "@/components/admin-resource-email";
import { resourceReadiness } from "@/server/email/resource-readiness";
import { uniqueClassRecipients } from "@/server/email/class-email";
import { getDb } from "@/lib/db";
import { bookings } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export default async function ClassResourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const row = await getAdminClassById(id);
  if (!row) notFound();
  const resources = await getClassResources(id);
  const participants = await getDb().select({ email: bookings.email, fullName: bookings.fullName }).from(bookings).where(and(eq(bookings.classId, id), inArray(bookings.status, ["CONFIRMED", "PARTIALLY_REFUNDED"])));
  return <div>
    <Link href="/admin/classes" className="ink-link">← All classes</Link>
    <h1 className="display mt-6 text-4xl text-[var(--forest)]">{row.class.title}</h1>
    <p className="mt-3 text-sm text-[var(--muted)]">{formatDateTime(row.class.startAt, row.class.timezone)} · {row.class.timezone}</p>
    <AdminClassNav classId={id} current="resources" />
    <ClassResourceManager classId={id} resources={resources.map(({ id, title, kind, published }) => ({ id, title, kind, published }))} />
    <AdminResourceEmail classId={id} recipientCount={uniqueClassRecipients(participants).length} ready={await resourceReadiness(resources)} />
  </div>;
}
