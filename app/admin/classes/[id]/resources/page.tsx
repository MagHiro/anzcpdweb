import { notFound } from "next/navigation";
import { uuidSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/utils";
import { getAdminClassById } from "@/server/catalogue/queries";
import { getClassResources } from "@/server/bookings/resources";
import { AdminClassNav } from "@/components/admin-class-nav";
import { AdminPageHeading } from "@/components/admin-page-heading";
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
    <AdminPageHeading title={row.class.title} back={{ href: "/admin/classes", label: "All classes" }} description={`${formatDateTime(row.class.startAt, row.class.timezone)} · ${row.class.timezone}`} />
    <AdminClassNav classId={id} current="resources" />
    <div className="admin-resource-layout">
      <ClassResourceManager classId={id} resources={resources.map(({ id, title, kind, published, objectKey }) => ({ id, title, kind, published, objectKey }))} />
      <AdminResourceEmail classId={id} recipientCount={uniqueClassRecipients(participants).length} ready={await resourceReadiness(resources)} />
    </div>
  </div>;
}
