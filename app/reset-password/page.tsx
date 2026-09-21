import { AuthForm } from "@/components/auth-form";
import { Container, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <Section><Container className="max-w-md"><p className="eyebrow text-[var(--fern)]">Account security</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Choose a new password.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Use a strong password you do not reuse elsewhere.</p><div className="mt-8">{params.token ? <AuthForm mode="reset" resetToken={params.token} /> : <p className="rounded-xl bg-[#fff0ee] p-4 text-sm text-[var(--error)]">This reset link is missing its token. Request a new link.</p>}</div></Container></Section>; }
