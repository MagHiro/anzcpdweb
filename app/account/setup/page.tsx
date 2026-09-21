import { AuthFrame } from "@/components/ui";
import { AccountSetupForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";

export default async function AccountSetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const params = await searchParams; return <AuthFrame eyebrow="Paid booking · account setup" title="Set a password you control." description="This one-time link was sent to the email used for a paid booking. It lets us establish email ownership without sending a password." aside="Your account will connect to the booking email after setup, keeping future confirmations and CPD records in one place."><AccountSetupForm token={params.token} /></AuthFrame>; }
