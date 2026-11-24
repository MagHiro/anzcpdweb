import { getCategories, getPresenters } from "@/server/catalogue/queries";
import { AdminClassForm } from "@/components/admin-forms";
import { AdminPageHeading } from "@/components/admin-page-heading";

export default async function NewAdminClassPage() {
  const [categories, presenters] = await Promise.all([getCategories(), getPresenters()]);
  return <div>
    <AdminPageHeading title="Create a class" back={{ href: "/admin/classes", label: "All classes" }} description="New classes are saved as drafts. Add the schedule, delivery details and price before publishing." />
    <div className="mt-6"><AdminClassForm categories={categories} presenters={presenters} /></div>
  </div>;
}
