import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { ClassDescription } from "@/components/class-description";
import { ActivityDetailIcon, Container, LinkButton, Price } from "@/components/ui";
import { getClassSourceReferences, getPublishedClassBySlug } from "@/server/catalogue/queries";
import { getCpdLabel } from "@/lib/domain/countries";
import { ClassTimezoneProvider, VisitorTime } from "@/components/visitor-time";
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
  const availability = record.remainingSeats === null ? "No seat limit" : `${record.remainingSeats} ${record.remainingSeats === 1 ? "seat" : "seats"} left`;
  const bookingStatus = record.status === "CANCELLED" ? "This class has been cancelled." : record.remainingSeats === 0 ? "This class is sold out." : "Bookings are closed.";

  return <ClassTimezoneProvider online={record.deliveryFormat === "ONLINE"}>
    <Container className="class-detail-page">
    <header className="class-detail-hero">
      <Link href="/classes" className="class-back-link focus-ring"><ArrowRight size={17} /> All classes</Link>
      <h1>{record.title}</h1>
    </header>
    <div className="class-detail-layout">
      <section className="class-schedule" aria-labelledby="class-schedule-title">
        <h2 id="class-schedule-title">Schedule</h2>
        <dl>
          <div><dt><ActivityDetailIcon kind="calendar" /><span className="sr-only">When</span></dt><dd><VisitorTime startAt={record.startAt.toISOString()} endAt={record.endAt.toISOString()} timezone={record.timezone} inlineRange /></dd></div>
          <div><dt><ActivityDetailIcon kind="location" /><span className="sr-only">Delivery</span></dt><dd>{format}{record.deliveryFormat !== "ONLINE" && <span className="class-schedule-note">{record.venueName ?? "Venue details supplied after booking"}</span>}</dd></div>
        </dl>
      </section>
      <aside className="class-booking-panel" aria-labelledby="class-booking-title">
        <h2 id="class-booking-title">Booking</h2>
        <p className="class-booking-price"><Price amount={record.priceMinorUnits} currency={record.currency} /></p>
        <dl className="class-booking-facts">
          {cpd && <div><dt>CPD credit</dt><dd>{cpd}</dd></div>}
          {bookable && <div><dt>Availability</dt><dd>{availability}</dd></div>}
          <div><dt>Professional ID</dt><dd>{record.professionalIdentifierRequired ? record.country === "AU" ? "MARN required" : "IAA licence required" : "Not required"}</dd></div>
        </dl>
        {bookable ? <LinkButton href={`/classes/${record.slug}/book`} className="class-booking-action">Book this class <ArrowRight size={18} /></LinkButton> : <p role="status" className="class-booking-status">{bookingStatus}</p>}
      </aside>
      <div className="class-detail-content">
        {record.mediaKey && <div className="class-detail-image"><Image src={`/assets/${record.mediaKey}`} alt={record.mediaAltText ?? record.title} width={1200} height={720} className="h-auto w-full object-cover" /></div>}
        <section className="class-detail-section class-about">
          <h2>About the class</h2>
          <div><p className="class-detail-context">{record.country === "AU" ? "Australia" : "New Zealand"}{record.categoryName && <> · {record.categoryName}</>}</p><ClassDescription text={record.fullDescription} /></div>
        </section>
        {record.presenterName && <section className="class-detail-section class-presenter">
          <h2>Presenter</h2>
          <div className="class-presenter-person">
            <h3>{record.presenterName}</h3>{record.presenterRole && <p>{record.presenterRole}</p>}
            {record.presenterSlug && <Link href={`/presenters/${record.presenterSlug}`} className="ink-link focus-ring mt-4">View profile <ArrowUpRight size={16} /></Link>}
          </div>
        </section>}
        {sourceRows.length > 0 && <section className="class-detail-section class-references"><h2>Sources</h2><div><p className="text-sm leading-6 text-[var(--muted)]">Check the linked authority for current requirements.</p>
          <ul>{sourceRows.map(({ source }) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="ink-link focus-ring">{source.title} <ArrowUpRight size={16} /></a><span>{source.authority} · checked {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(source.checkedAt)}</span></li>)}</ul>
        </div></section>}
      </div>
    </div>
    </Container>
  </ClassTimezoneProvider>;
}
