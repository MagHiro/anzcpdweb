import { AuthForm } from "@/components/auth-form";
import { Container, Section } from "@/components/ui";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() { return <Section><Container className="max-w-md"><p className="eyebrow text-[var(--fern)]">Account security</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Reset your password.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">If an account exists for that email, we’ll send instructions. The response is the same either way.</p><div className="mt-8"><AuthForm mode="forgot" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} /></div></Container></Section>; }
