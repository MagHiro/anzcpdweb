import { getServerEnv, isEmailProviderConfigured } from "@/lib/env";
import { hasRealCredential } from "@/lib/configuration";
import { StatusBadge } from "@/components/ui";
import { AdminPageHeading } from "@/components/admin-page-heading";

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
  return <div><AdminPageHeading title="Settings" description="These checks show which credentials are configured. They don’t test live connections or display secret values." />
    {!stripeReady && <div className="mt-6 rounded-xl border border-[#e5d0ae] bg-[#fbf3e7] p-5"><h2 className="font-semibold text-[#8d5b24]">Payments are not ready</h2><p className="mt-2 text-sm leading-6">Configure valid Stripe credentials and the webhook signing secret in the production environment before accepting payments. Placeholder values do not count as configured.</p><p className="mt-3 break-all font-mono text-xs">Webhook: {env.APP_URL}/api/stripe/webhook</p></div>}
    <section className="admin-settings-checks" aria-labelledby="admin-service-checks"><h2 id="admin-service-checks">Service configuration</h2><dl>{checks.map(check => <div key={check.label}><dt>{check.label}</dt><dd><StatusBadge status={check.configured ? "CONFIGURED" : "MISSING"} /></dd></div>)}</dl></section>
  </div>;
}
