import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Section } from "@/components/ui";
import { ArrowRight } from "@/components/icon";
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
  const back = <Link href={`/classes/${record.slug}`} className="class-back-link focus-ring"><ArrowRight size={17} /> Back to class details</Link>;
  if (!record.isBookingOpen) return <Section className="booking-page"><Container><header className="booking-heading">
    {back}<h1>This class can’t be booked right now</h1><p>Check the class page for the current status.</p>
  </header></Container></Section>;
  const bookingClass = {
    slug: record.slug,
    country: record.country,
    title: record.title,
    startAt: record.startAt,
    deliveryFormat: record.deliveryFormat,
    timezone: record.timezone,
    cpdUnitType: record.cpdUnitType,
    cpdUnitAmount: record.cpdUnitAmount,
    priceMinorUnits: record.priceMinorUnits,
    currency: record.currency,
    professionalIdentifierRequired: record.professionalIdentifierRequired,
  };
  return <Section className="booking-page"><Container>
    <header className="booking-heading">{back}<h1>Complete your booking</h1></header>
    <BookingForm classRecord={bookingClass} siteKey={getServerEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
  </Container></Section>;
}
