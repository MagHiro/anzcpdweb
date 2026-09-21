import { getServerSession } from "@/server/auth/session";
import { ChangePasswordForm } from "@/components/profile-forms";

export default async function AccountSecurityPage() { const session = await getServerSession(); if (!session) return null; return <div><p className="eyebrow text-[var(--fern)]">Account security</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Security</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Use a unique password. Sessions are managed by Better Auth with secure, HttpOnly cookies.</p><div className="mt-8 max-w-xl rounded-[1.3rem] border border-[var(--line)] bg-white p-6"><ChangePasswordForm /></div></div>; }
