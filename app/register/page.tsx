import { AuthForm } from "@/components/auth-form";
import { AccountEntryLayout } from "@/components/account-entry-layout";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <AccountEntryLayout title="Create an account" description="We’ll email you a link to verify your address before you can sign in.">
    <AuthForm mode="register" siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
  </AccountEntryLayout>;
}
