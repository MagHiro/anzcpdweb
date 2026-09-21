import { CategoryManager } from "@/components/admin-managers";
import { getAdminCategories } from "@/server/catalogue/queries";

export default async function AdminCategoriesPage() { const rows = await getAdminCategories(); return <CategoryManager rows={rows} />; }
