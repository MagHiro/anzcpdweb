import { getServerSession } from "@/server/auth/session";
import { ChangePasswordForm } from "@/components/profile-forms";

export default async function AccountSecurityPage() { const session = await getServerSession(); if (!session) return null; return <div><p className="eyebrow text-[var(--fern)]">Account security</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Security</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Use a unique password. Sessions are managed by Better Auth with secure, HttpOnly cookies.</p><div className="mt-10 max-w-3xl"><ChangePasswordForm /></div></div>; }
