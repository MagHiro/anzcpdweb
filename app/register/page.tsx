import { AuthForm } from "@/components/auth-form";
import { Container, Section } from "@/components/ui";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function RegisterPage() { return <Section><Container className="max-w-md"><p className="eyebrow text-[var(--fern)]">Customer account</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Keep your CPD record together.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Create an account to manage bookings. Email verification is required before sign-in.</p><div className="mt-8"><AuthForm mode="register" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} /></div></Container></Section>; }
