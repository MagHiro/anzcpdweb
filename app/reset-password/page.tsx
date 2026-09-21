import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <AuthFrame eyebrow="Account security" title="Choose a new password." description="Use a strong password you do not reuse elsewhere." aside="Recovery links are time-limited and never expose your previous password or account details.">{params.token ? <AuthForm mode="reset" resetToken={params.token} /> : <p className="rounded-xl border border-[#e8beb8] bg-[#fff0ee] p-4 text-sm text-[var(--error)]">This reset link is missing its token. Request a new link.</p>}</AuthFrame>; }
