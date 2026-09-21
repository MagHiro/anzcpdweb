import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/server/auth/session";
import { Container } from "@/components/ui";
import { SignOutButton } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/account");
  return <div className="min-h-[75vh] bg-[var(--mist)]"><Container className="grid gap-8 py-8 lg:grid-cols-[240px_1fr] lg:py-14"><aside className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_40px_rgba(18,36,31,.04)] lg:sticky lg:top-28 lg:h-fit"><p className="px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--muted)]">Your account</p><p className="mt-3 truncate px-3 text-sm font-bold text-[var(--forest)]">{session.user.name}</p><nav className="mt-5 grid gap-1 text-sm"><Link href="/account" className="focus-ring rounded-lg px-3 py-2.5 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Overview</Link><Link href="/account/bookings" className="focus-ring rounded-lg px-3 py-2.5 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Bookings</Link><Link href="/account/profile" className="focus-ring rounded-lg px-3 py-2.5 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Profile</Link><Link href="/account/security" className="focus-ring rounded-lg px-3 py-2.5 font-semibold text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--forest)]">Security</Link><div className="mt-3 border-t border-[var(--line)] px-3 pt-4"><SignOutButton /></div></nav></aside><div className="min-w-0">{children}</div></Container></div>;
}
