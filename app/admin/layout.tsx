import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSessionOrNull } from "@/server/auth/session";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionOrNull();
  if (!session) redirect("/sign-in?next=/admin");
  return <Workspace admin name={session.user.name}>{children}</Workspace>;
}
