import { getServerEnv, isEmailProviderConfigured } from "@/lib/env";
import { hasRealCredential } from "@/lib/configuration";
import { StatusBadge } from "@/components/ui";

export default function AdminSettingsPage() {
  const env = getServerEnv();
  const stripeReady = hasRealCredential(env.STRIPE_SECRET_KEY) && hasRealCredential(env.STRIPE_WEBHOOK_SECRET);
  const checks = [
    { label: "Stripe secret key", configured: hasRealCredential(env.STRIPE_SECRET_KEY) },
    { label: "Stripe webhook secret", configured: hasRealCredential(env.STRIPE_WEBHOOK_SECRET) },
    { label: "Turnstile server key", configured: hasRealCredential(env.TURNSTILE_SECRET_KEY) },
    { label: "Transactional email", configured: isEmailProviderConfigured(env) },
    { label: "Database", configured: Boolean(env.DATABASE_URL) },
  ];
  return <div><h1 className="display text-5xl text-[var(--forest)]">Settings</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Configuration checks—not live connection tests. Secret values are never displayed.</p>
    {!stripeReady && <div className="mt-6 rounded-xl border border-[#e5d0ae] bg-[#fbf3e7] p-5"><h2 className="font-semibold text-[#8d5b24]">Payments are not ready</h2><p className="mt-2 text-sm leading-6">Configure valid Stripe credentials and the webhook signing secret in the production environment before accepting payments. Placeholder values do not count as configured.</p><p className="mt-3 break-all font-mono text-xs">Webhook: {env.APP_URL}/api/stripe/webhook</p></div>}
    <div className="mt-8 rounded-xl border border-[var(--line)] bg-white p-6"><div className="grid gap-4">{checks.map(check => <div key={check.label} className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4 last:border-0 last:pb-0"><span className="text-sm font-semibold text-[var(--forest)]">{check.label}</span><StatusBadge status={check.configured ? "CONFIGURED" : "MISSING"} /></div>)}</div><p className="mt-6 text-xs leading-5 text-[var(--muted)]">Settings are environment-managed so secrets stay outside the database and browser.</p></div>
  </div>;
}
