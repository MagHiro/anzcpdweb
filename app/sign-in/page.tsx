import { AuthForm } from "@/components/auth-form";
import { Container, Section } from "@/components/ui";
import { getServerEnv } from "@/lib/env";
import { safeInternalPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const params = await searchParams; const redirectTo = safeInternalPath(params.next); return <Section><Container className="max-w-md"><p className="eyebrow text-[var(--fern)]">Customer account</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Welcome back.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Sign in to see your upcoming classes, payment state and previous CPD bookings.</p><div className="mt-8"><AuthForm mode="login" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} redirectTo={redirectTo} /></div></Container></Section>; }
