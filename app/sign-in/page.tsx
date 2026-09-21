import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/ui";
import { getServerEnv } from "@/lib/env";
import { safeInternalPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const params = await searchParams; const redirectTo = safeInternalPath(params.next); return <AuthFrame eyebrow="Customer account" title="Welcome back." description="Sign in to see your upcoming classes, payment state and previous CPD bookings." aside="Your account keeps booking references, payment states and confirmed attendance details together."><AuthForm mode="login" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} redirectTo={redirectTo} /></AuthFrame>; }
