import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/ui";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function RegisterPage() { return <AuthFrame eyebrow="Customer account" title="Keep your CPD record together." description="Create an account to manage bookings. Email verification is required before sign-in." aside="Create your account once, then return to one place for upcoming sessions, past bookings and secure confirmations."><AuthForm mode="register" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} /></AuthFrame>; }
