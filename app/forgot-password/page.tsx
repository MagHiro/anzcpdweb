import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/ui";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() { return <AuthFrame eyebrow="Account security" title="Reset your password." description="If an account exists for that email, we’ll send instructions. The response is the same either way." aside="We keep account recovery deliberately private and never reveal whether an email is registered."><AuthForm mode="forgot" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} /></AuthFrame>; }
