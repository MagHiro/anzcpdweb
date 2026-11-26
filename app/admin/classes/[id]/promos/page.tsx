import { desc, eq, getTableColumns } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { AdminClassNav } from "@/components/admin-class-nav";
import { AdminPageHeading } from "@/components/admin-page-heading";
import { ClassPromoForm, ClassPromoModeForm } from "@/components/admin-promo-forms";
import { classPromoCodes } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { uuidSchema } from "@/lib/validation";
import { getAdminClassById } from "@/server/catalogue/queries";
import { getAdminSessionOrNull } from "@/server/auth/session";
import { promoUsageCount } from "@/server/bookings/promos";

export default async function ClassPromosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  if (!await getAdminSessionOrNull()) redirect("/sign-in?next=/admin");
  const row = await getAdminClassById(id);
  if (!row) notFound();
  const { slug, title, currency, timezone, promoMode } = row.class;
  const promos = await getDb().select({ ...getTableColumns(classPromoCodes), usageCount: promoUsageCount })
    .from(classPromoCodes).where(eq(classPromoCodes.classId, id)).orderBy(desc(classPromoCodes.createdAt));
  const origin = getServerEnv().APP_URL;

  return <div>
    <AdminPageHeading title={title} back={{ href: "/admin/classes", label: "All classes" }} />
    <AdminClassNav classId={id} current="promos" />
    <div className="space-y-6">
      <section className="admin-detail-panel">
        <h2>Promo settings</h2>
        <ClassPromoModeForm classId={id} mode={promoMode} />
      </section>
      <section className="admin-detail-panel">
        <h2>Create a promo code</h2>
        <ClassPromoForm classId={id} currency={currency} timezone={timezone} />
      </section>
      {promos.map(promo => {
        const link = new URL(`/classes/${slug}/book`, origin);
        link.searchParams.set("promo", promo.linkToken);
        return <section className="admin-detail-panel" key={promo.id}>
          <h2>{promo.code}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {promo.usageCount}{promo.maxUses !== null ? ` of ${promo.maxUses}` : ""} uses booked or reserved
          </p>
          <ClassPromoForm classId={id} currency={currency} timezone={timezone} promo={promo} link={link.toString()} />
        </section>;
      })}
    </div>
  </div>;
}
