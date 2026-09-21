import { getServerSession } from "@/server/auth/session";
import { ProfileForm } from "@/components/profile-forms";

export default async function AccountProfilePage() { const session = await getServerSession(); if (!session) return null; return <div><p className="eyebrow text-[var(--fern)]">Account details</p><h1 className="display mt-3 text-5xl text-[var(--forest)]">Profile</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Keep the contact details used for your account current. Booking snapshots remain unchanged for historical accuracy.</p><div className="mt-8 max-w-xl rounded-[1.3rem] border border-[var(--line)] bg-white p-6"><ProfileForm name={session.user.name} email={session.user.email} /></div></div>; }
