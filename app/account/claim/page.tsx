import { Container, LinkButton, Section } from "@/components/ui";
import { ClaimForm, ClaimRequestForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";

export default async function ClaimBookingsPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <Section><Container className="max-w-md"><p className="eyebrow text-[var(--fern)]">Booking records</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Connect a previous booking.</h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Sign in first. We only connect records when the secure link email matches the signed-in account email.</p><div className="mt-8">{params.token ? <ClaimForm token={params.token} /> : <><ClaimRequestForm /><p className="mt-4 text-center text-sm text-[var(--muted)]">Not signed in? <LinkButton href="/sign-in" variant="quiet">Sign in</LinkButton></p></>}</div></Container></Section>; }
