import { AuthFrame, LinkButton } from "@/components/ui";
import { ClaimForm, ClaimRequestForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";

export default async function ClaimBookingsPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <AuthFrame eyebrow="Booking records" title="Connect a previous booking." description="Sign in first. We only connect records when the secure link email matches the signed-in account email." aside="Only matching email addresses can connect a booking, so your payment history stays private.">{params.token ? <ClaimForm token={params.token} /> : <><ClaimRequestForm /><p className="mt-4 text-center text-sm text-[var(--muted)]">Not signed in? <LinkButton href="/sign-in" variant="quiet">Sign in</LinkButton></p></>}</AuthFrame>; }
