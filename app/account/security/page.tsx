import { getServerSession } from "@/server/auth/session";
import { ChangePasswordForm } from "@/components/profile-forms";
import { MfaSettings } from "@/components/mfa-settings";

export default async function AccountSecurityPage() { const session = await getServerSession(); if (!session) return null; return <div><h1 className="display text-5xl text-[var(--forest)]">Security</h1><div className="mt-10 max-w-3xl"><ChangePasswordForm /><MfaSettings enabled={session.user.twoFactorEnabled ?? false} /></div></div>; }
