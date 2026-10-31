import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { Container, CountryBadge, LinkButton, Price, Section } from "@/components/ui";
import { getClassSourceReferences, getPublishedClassBySlug } from "@/server/catalogue/queries";
import { getCpdLabel } from "@/lib/domain/countries";
import { ClassTimezoneProvider, VisitorTime } from "@/components/visitor-time";
import { presenterInitials } from "@/lib/presenter-initials";

function formatDateTime(value: Date, timezone: string) {
  return <VisitorTime startAt={new Date(value).toISOString()} timezone={timezone} />;
}
import { slugSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) notFound();
  const record = await getPublishedClassBySlug(slug).catch(() => null);
  if (!record) return { title: "Class not found" };
  return { robots: record.isUnlisted ? { index: false, follow: false } : undefined, title: record.seoTitle ?? record.title, description: record.seoDescription ?? record.shortDescription, alternates: { canonical: `/classes/${record.slug}` }, openGraph: { title: record.title, description: record.shortDescription, type: "article" } };
}

export default async function ClassDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) notFound();
  const record = await getPublishedClassBySlug(slug);
  if (!record) notFound();
  const sourceRows = await getClassSourceReferences(record.id).catch(() => []);
  const cpd = getCpdLabel(record.cpdUnitType, record.cpdUnitAmount);
  const bookable = record.isBookingOpen;
  const format = record.deliveryFormat === "ONLINE" ? "Online" : record.deliveryFormat === "IN_PERSON" ? "In person" : "Hybrid";
  const availability = record.remainingSeats === null ? "Open capacity" : record.remainingSeats > 0 ? `${record.remainingSeats} seats left` : "Sold out";

  return <ClassTimezoneProvider online={record.deliveryFormat === "ONLINE"}>
    <section className="class-detail-hero"><Container>
      <Link href="/classes" className="class-back-link focus-ring">← CPD activities</Link>
      <div className="class-detail-context"><CountryBadge country={record.country} /><span>{record.categoryName}</span></div>
      <h1>{record.title}</h1>
      <p className="class-detail-summary">{record.shortDescription}</p>
    </Container></section>
    <Section className="class-detail-body"><Container><div className="class-detail-layout">
      <div className="class-detail-content">
        {record.mediaKey && <div className="class-detail-image"><Image src={`/assets/${record.mediaKey}`} alt={record.mediaAltText ?? record.title} width={1200} height={720} className="h-auto w-full object-cover" /></div>}
        <dl className="class-schedule">
          <div><dt>Starts</dt><dd>{formatDateTime(record.startAt, record.timezone)}</dd></div>
          <div><dt>Ends</dt><dd>{formatDateTime(record.endAt, record.timezone)}</dd></div>
          <div><dt>Delivery</dt><dd>{format}<span className="class-schedule-note">{record.deliveryFormat !== "ONLINE" ? record.venueName ?? "Venue details supplied after booking" : "Secure online attendance"}</span></dd></div>
        </dl>
        <section className="class-about"><h2>About this activity</h2><p>{record.fullDescription}</p></section>
        {record.presenterName && <section className="class-presenter">
          <h2>Your presenter</h2>
          <div className="class-presenter-person"><div className="class-presenter-avatar" aria-hidden="true">{presenterInitials(record.presenterName)}</div><div className="min-w-0">
            <h3>{record.presenterName}</h3><p>{record.presenterRole ?? "Migration professional and facilitator"}</p>
            {record.presenterSlug && <Link href={`/presenters/${record.presenterSlug}`} className="ink-link focus-ring mt-4">View profile <ArrowUpRight size={16} /></Link>}
          </div></div>
        </section>}
        {sourceRows.length > 0 && <section className="class-references"><h2>Editorial references</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Course references are provided for traceability. Check the linked authority for current requirements.</p>
          <ul className="mt-5 grid gap-3 text-sm">{sourceRows.map(({ source }) => <li key={source.id} className="rounded-2xl bg-white p-5"><a href={source.url} target="_blank" rel="noreferrer" className="focus-ring font-semibold text-[var(--forest)] underline underline-offset-4">{source.title}</a><span className="mt-2 block text-xs text-[var(--muted)]">{source.authority} · checked {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(source.checkedAt)}</span></li>)}</ul>
        </section>}
      </div>
      <aside className="class-booking-sidebar"><div className="class-booking-panel">
        <h2>Reserve a place</h2><p className="class-booking-price"><Price amount={record.priceMinorUnits} currency={record.currency} /></p>
        <dl className="class-booking-facts">
          {cpd && <div><dt>CPD value</dt><dd>{cpd}</dd></div>}
          <div><dt>Availability</dt><dd>{availability}</dd></div>
          <div><dt>Identifier</dt><dd>{record.professionalIdentifierRequired ? record.country === "AU" ? "MARN required" : "IAA licence required" : "Not required"}</dd></div>
        </dl>
        {bookable ? <LinkButton href={`/classes/${record.slug}/book`} className="mt-7 w-full">Book this class <ArrowRight className="ml-3" size={18} /></LinkButton> : <div role="status" className="mt-7 rounded-2xl bg-[var(--mist)] p-4 text-sm leading-6 text-[var(--muted)]">{record.status === "CANCELLED" ? "This class has been cancelled." : record.remainingSeats === 0 ? "This class is currently sold out." : "Booking is closed for this class."}</div>}
        <Link href="/classes" className="focus-ring mt-5 block text-center text-sm font-medium text-[var(--muted)] underline underline-offset-4">Back to catalogue</Link>
      </div></aside>
    </div></Container></Section>
  </ClassTimezoneProvider>;
}
