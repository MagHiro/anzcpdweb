import { Container, Section } from "@/components/ui";
import { AccountSetupForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";

export default async function AccountSetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <Section><Container className="max-w-md"><p className="eyebrow text-[var(--fern)]">Paid booking · account setup</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Set a password you control.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">This one-time link was sent to the email used for a paid booking. It lets us establish email ownership without sending a password.</p><div className="mt-8"><AccountSetupForm token={params.token} /></div></Container></Section>; }
