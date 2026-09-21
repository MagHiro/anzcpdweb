import { Container, LinkButton, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function BookingSuccessPage() {
  return <Section className="bg-[var(--paper)]"><Container className="max-w-3xl"><div className="surface-grid rounded-[1.7rem] border border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center shadow-[var(--shadow-soft)] sm:px-12 sm:py-20"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f3ec] text-2xl font-bold text-[var(--fern)]">✓</div><p className="eyebrow mt-8 text-[var(--fern)]">Payment submitted</p><h1 className="display mt-4 text-5xl leading-[.96] text-[var(--forest)] sm:text-6xl">We’re confirming your booking.</h1><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">Stripe has received the checkout request. Your place is confirmed only after our server receives and verifies the payment event. You can safely check your email or account shortly.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><LinkButton href="/account" variant="secondary">Go to my account</LinkButton><LinkButton href="/classes">Browse more classes</LinkButton></div><p className="mt-6 text-xs text-[var(--muted)]">If payment state is still processing, do not pay again. Refresh your account after a moment.</p></div></Container></Section>;
}
