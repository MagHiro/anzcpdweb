import { getServerSession } from "@/server/auth/session";
import { ChangePasswordForm } from "@/components/profile-forms";

export default async function AccountSecurityPage() { const session = await getServerSession(); if (!session) return null; return <div><p className="eyebrow text-[var(--fern)]">Account security</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Security</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Use a unique password. Sessions are managed by Better Auth with secure, HttpOnly cookies.</p><div className="surface-grid mt-8 max-w-xl rounded-[1.3rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_12px_40px_rgba(18,36,31,.04)]"><ChangePasswordForm /></div></div>; }
