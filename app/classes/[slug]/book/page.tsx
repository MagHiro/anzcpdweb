import { notFound } from "next/navigation";
import { Container, LinkButton, Section } from "@/components/ui";
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
  return <Section><Container className="max-w-3xl"><div className="mb-10"><p className="eyebrow text-[var(--fern)]">Secure booking</p><h1 className="display mt-4 text-5xl text-[var(--forest)] sm:text-6xl">Reserve your place.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">You can continue as a guest. A place is held for a short time while Stripe Checkout processes payment.</p></div><BookingForm classRecord={bookingClass} siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} /></Container></Section>;
}
