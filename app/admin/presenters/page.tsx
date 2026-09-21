import { PresenterManager } from "@/components/admin-managers";
import { getAdminPresenters } from "@/server/catalogue/queries";

export default async function AdminPresentersPage() {
  const rows = await getAdminPresenters();
  return <PresenterManager rows={rows} />;
}
