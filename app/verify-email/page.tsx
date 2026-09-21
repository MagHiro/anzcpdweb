import { Container, LinkButton, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() { return <Section><Container className="max-w-xl text-center"><p className="eyebrow text-[var(--fern)]">Check your inbox</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">Verify your email to continue.</h1><p className="mt-5 text-base leading-7 text-[var(--muted)]">We sent a verification link if the address can be used. After verification, sign in to manage your bookings.</p><div className="mt-8"><LinkButton href="/sign-in">Back to sign in</LinkButton></div></Container></Section>; }
