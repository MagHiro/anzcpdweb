import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { Workspace } from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/account");
  return <Workspace name={session.user.name}>{children}</Workspace>;
}
