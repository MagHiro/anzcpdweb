import { Container, LinkButton, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function BookingCancelledPage() { return <Section><Container className="max-w-2xl text-center"><p className="eyebrow text-[var(--ochre)]">Checkout closed</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">No payment was confirmed here.</h1><p className="mt-5 text-base leading-7 text-[var(--muted)]">If you closed Stripe Checkout, the payment session may expire and release its reservation. Check your account before starting another payment if you are unsure about the status.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><LinkButton href="/classes">Return to classes</LinkButton><LinkButton href="/account" variant="secondary">Check my account</LinkButton></div></Container></Section>; }
