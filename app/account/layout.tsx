import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { Container } from "@/components/ui";
import { SignOutButton } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/account");
  return <div className="min-h-[70vh] bg-[var(--mist)]"><Container className="grid gap-8 py-10 lg:grid-cols-[220px_1fr] lg:py-14"><aside className="rounded-[1.4rem] border border-[var(--line)] bg-white p-4 lg:h-fit"><p className="px-3 text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Your account</p><p className="mt-3 px-3 truncate text-sm font-bold text-[var(--forest)]">{session.user.name}</p><nav className="mt-5 grid gap-1 text-sm"><Link href="/account" className="rounded-lg px-3 py-2 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Overview</Link><Link href="/account/bookings" className="rounded-lg px-3 py-2 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Bookings</Link><Link href="/account/profile" className="rounded-lg px-3 py-2 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Profile</Link><Link href="/account/security" className="rounded-lg px-3 py-2 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Security</Link><div className="mt-3 border-t border-[var(--line)] pt-3 px-3"><SignOutButton /></div></nav></aside><div className="min-w-0">{children}</div></Container></div>;
}
