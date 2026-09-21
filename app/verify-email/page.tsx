import { AuthFrame, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() { return <AuthFrame eyebrow="Check your inbox" title="Verify your email to continue." description="We sent a verification link if the address can be used. After verification, sign in to manage your bookings." aside="Email verification protects your booking history and keeps payment confirmations connected to the right account."><LinkButton href="/sign-in">Back to sign in</LinkButton></AuthFrame>; }
