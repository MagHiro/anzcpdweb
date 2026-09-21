import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
import { AuthFrame } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <AuthFrame eyebrow="Account security" title="Choose a new password." description="Use a strong password you do not reuse elsewhere." aside="Recovery links are time-limited and never expose your previous password or account details.">{params.token ? <AuthForm mode="reset" resetToken={params.token} /> : <p className="rounded-xl border border-[#e8beb8] bg-[#fff0ee] p-4 text-sm text-[var(--error)]">This reset link is incomplete. <Link href="/forgot-password" className="font-semibold underline">Request a new reset link</Link>.</p>}</AuthFrame>; }
