import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, CountryBadge, LinkButton, Price, Section, StatusBadge } from "@/components/ui";
import { getClassSourceReferences, getPublishedClassBySlug } from "@/server/catalogue/queries";
import { getCpdLabel } from "@/lib/domain/countries";
import { formatDateTime } from "@/lib/utils";
import { slugSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) notFound();
  const record = await getPublishedClassBySlug(slug).catch(() => null);
  if (!record) return { title: "Class not found" };
  return { title: record.seoTitle ?? record.title, description: record.seoDescription ?? record.shortDescription, alternates: { canonical: `/classes/${record.slug}` }, openGraph: { title: record.title, description: record.shortDescription, type: "article" } };
}

export default async function ClassDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const record = await getPublishedClassBySlug(slug).catch(() => null);
  if (!record) notFound();
  const sourceRows = await getClassSourceReferences(record.id).catch(() => []);
  const cpd = getCpdLabel(record.cpdUnitType, record.cpdUnitAmount);
  const bookable = record.isBookingOpen;
  return <Section><Container><div className="grid gap-12 lg:grid-cols-[1fr_.65fr]"><div><div className="flex flex-wrap items-center gap-3"><CountryBadge country={record.country} /><StatusBadge status={record.status} /><span className="text-sm text-[var(--muted)]">{record.categoryName}</span></div><h1 className="display mt-6 max-w-4xl text-5xl leading-[.98] text-[var(--forest)] sm:text-7xl">{record.title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">{record.shortDescription}</p>{record.mediaKey ? <div className="relative mt-10 overflow-hidden rounded-[1.5rem] bg-[var(--mist)]"><Image src={`/assets/${record.mediaKey}`} alt={record.mediaAltText ?? record.title} width={1200} height={720} className="h-auto w-full object-cover" /></div> : null}<div className="mt-10 grid gap-4 border-y border-[var(--line)] py-6 sm:grid-cols-2"><div><p className="eyebrow text-[var(--fern)]">When</p><p className="mt-2 text-sm font-semibold text-[var(--ink)]">{formatDateTime(record.startAt, record.timezone)} – {formatDateTime(record.endAt, record.timezone)}</p><p className="mt-1 text-xs text-[var(--muted)]">Times shown in {record.timezone}</p></div><div><p className="eyebrow text-[var(--fern)]">Format</p><p className="mt-2 text-sm font-semibold text-[var(--ink)]">{record.deliveryFormat === "ONLINE" ? "Online" : record.deliveryFormat === "IN_PERSON" ? "In person" : "Hybrid"}</p><p className="mt-1 text-xs text-[var(--muted)]">{record.deliveryFormat !== "ONLINE" ? record.venueName : "Attendance details are provided after confirmed payment."}</p></div></div><div className="prose prose-slate mt-10 max-w-3xl whitespace-pre-line text-base leading-8 text-[#52635d]"><p>{record.fullDescription}</p></div>{sourceRows.length ? <div className="mt-12 border-t border-[var(--line)] pt-7"><p className="eyebrow text-[var(--fern)]">Editorial references</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Course references are provided for traceability. Check the linked authority for current requirements.</p><ul className="mt-4 grid gap-3 text-sm">{sourceRows.map(({ source }) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-[var(--forest)] underline underline-offset-4">{source.title}</a><span className="ml-2 text-[var(--muted)]">{source.authority} · checked {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(source.checkedAt)}</span></li>)}</ul></div> : null}</div><aside className="lg:pt-16"><div className="sticky top-6 rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-[0_18px_50px_rgba(23,60,55,.06)]"><p className="eyebrow text-[var(--fern)]">Reserve a place</p><div className="mt-3 flex items-end justify-between gap-4"><Price amount={record.priceMinorUnits} currency={record.currency} />{cpd ? <span className="text-sm text-[var(--muted)]">{cpd}</span> : null}</div><div className="mt-6 grid gap-3 border-t border-[var(--line)] pt-5 text-sm"><div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Availability</span><span className="font-bold text-[var(--ink)]">{record.remainingSeats === null ? "Open capacity" : record.remainingSeats > 0 ? `${record.remainingSeats} seats left` : "Sold out"}</span></div><div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Identifier</span><span className="text-right font-semibold text-[var(--ink)]">{record.professionalIdentifierRequired ? record.country === "AU" ? "MARN required" : "IAA licence number required" : "Not required"}</span></div></div>{bookable ? <LinkButton href={`/classes/${record.slug}/book`} className="mt-7 w-full">Book this class</LinkButton> : <div className="mt-7 rounded-xl bg-[var(--mist)] p-4 text-sm leading-6 text-[var(--muted)]">{record.status === "CANCELLED" ? "This class has been cancelled." : record.remainingSeats === 0 ? "This class is currently sold out." : "Booking is closed for this class."}</div>}<Link href="/classes" className="mt-5 block text-center text-sm font-bold text-[var(--forest)] underline underline-offset-4">Back to catalogue</Link></div></aside></div></Container></Section>;
}
