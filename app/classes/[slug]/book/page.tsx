import { notFound } from "next/navigation";
import { Container, LinkButton, PageIntro, Section } from "@/components/ui";
import { BookingForm } from "@/components/booking-form";
import { getPublishedClassBySlug } from "@/server/catalogue/queries";
import { getServerEnv } from "@/lib/env";
import { slugSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function BookClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) notFound();
  const record = await getPublishedClassBySlug(slug).catch(() => null);
  if (!record) notFound();
  if (!record.isBookingOpen) return <Section><Container className="max-w-2xl text-center"><p className="eyebrow text-[var(--fern)]">Booking unavailable</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">This class can’t be booked right now.</h1><p className="mt-4 text-base leading-7 text-[var(--muted)]">Availability may have changed since you opened the page. Return to the class details for the current status.</p><div className="mt-8"><LinkButton href={`/classes/${record.slug}`} variant="secondary">Back to class details</LinkButton></div></Container></Section>;
  const bookingClass = {
    slug: record.slug,
    country: record.country,
    title: record.title,
    startAt: record.startAt,
    timezone: record.timezone,
    cpdUnitType: record.cpdUnitType,
    cpdUnitAmount: record.cpdUnitAmount,
    priceMinorUnits: record.priceMinorUnits,
    currency: record.currency,
    professionalIdentifierRequired: record.professionalIdentifierRequired,
  };
  return <Section className="bg-[var(--paper)]"><Container className="max-w-[1180px]"><PageIntro eyebrow="Secure booking" title="Reserve your place." description="You can continue as a guest. A place is held for a short time while Stripe Checkout processes payment." /><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start"><BookingForm classRecord={bookingClass} siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} /><aside className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_12px_40px_rgba(18,36,31,.04)] lg:sticky lg:top-28"><p className="eyebrow text-[var(--fern)]">Before you continue</p><div className="mt-5 grid gap-5 text-sm"><div><p className="font-bold text-[var(--forest)]">Guest checkout is available</p><p className="mt-1 leading-6 text-[var(--muted)]">You can create an account after payment if you want an ongoing record.</p></div><div className="border-t border-[var(--line)] pt-5"><p className="font-bold text-[var(--forest)]">Stripe handles payment</p><p className="mt-1 leading-6 text-[var(--muted)]">Card details do not pass through or stay in this application.</p></div><div className="border-t border-[var(--line)] pt-5"><p className="font-bold text-[var(--forest)]">Your place is reserved briefly</p><p className="mt-1 leading-6 text-[var(--muted)]">Do not start another payment if the first checkout is still processing.</p></div></div><LinkButton href={`/classes/${record.slug}`} variant="quiet" className="mt-7 w-full">Review class details</LinkButton></aside></div></Container></Section>;
}
