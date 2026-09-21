import { Container, LinkButton, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function BookingCancelledPage() {
  return <Section className="bg-[var(--paper)]"><Container className="max-w-3xl"><div className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center shadow-[var(--shadow-soft)] sm:px-12 sm:py-20"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf3e7] text-2xl font-bold text-[var(--warning)]">×</div><p className="eyebrow mt-8 text-[var(--warning)]">Checkout closed</p><h1 className="display mt-4 text-5xl leading-[.96] text-[var(--forest)] sm:text-6xl">No payment was confirmed here.</h1><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">If you closed Stripe Checkout, the payment session may expire and release its reservation. Check your account before starting another payment if you are unsure about the status.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><LinkButton href="/classes">Return to classes</LinkButton><LinkButton href="/account" variant="secondary">Check my account</LinkButton></div></div></Container></Section>;
}
