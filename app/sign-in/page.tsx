import { AccountEntryLayout } from "@/components/account-entry-layout";
import { LoginForm } from "@/components/login-form";
import { getServerEnv } from "@/lib/env";
import { safeInternalPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AccountEntryLayout title="Sign in">
    <LoginForm siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} redirectTo={safeInternalPath(next)} />
  </AccountEntryLayout>;
}
