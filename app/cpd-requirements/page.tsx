import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { Container, EmptyState, LinkButton, Section } from "@/components/ui";
import { getCategories, getCountries, getPublicSourceReferences, getPublishedActivityTypes } from "@/server/catalogue/queries";

export const metadata: Metadata = { title: "CPD catalogue guide", description: "Explore academy learning categories, formats and source references before you book." };
export const dynamic = "force-dynamic";

export default async function CpdRequirementsPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let countries: Awaited<ReturnType<typeof getCountries>> = [];
  let activityTypes: Awaited<ReturnType<typeof getPublishedActivityTypes>> = [];
  let sources: Awaited<ReturnType<typeof getPublicSourceReferences>> = [];
  try { [categories, countries, activityTypes, sources] = await Promise.all([getCategories(), getCountries(), getPublishedActivityTypes(), getPublicSourceReferences()]); } catch { /* Render empty states rather than stale data. */ }
  const names = new Map(countries.map(country => [country.code, country.name]));
  return <div className="guide-layout">
    <aside className="guide-navigation"><nav aria-label="On this page">
      <a className="focus-ring" href="#guide-introduction">Overview</a><a className="focus-ring" href="#guide-topics">Learning topics</a><a className="focus-ring" href="#guide-formats">Ways to learn</a><a className="focus-ring" href="#guide-sources">Official sources</a>
    </nav></aside>
    <div className="guide-content">
      <section id="guide-introduction" className="guide-introduction"><Container>
        <h1>Make every learning choice count.</h1>
        <p>Find your professional focus, choose the right format and check the source material that supports each activity.</p>
        <LinkButton href="/classes" size="lg" className="mt-7">Explore the programme <ArrowUpRight size={18} className="ml-3" /></LinkButton>
      </Container></section>
      <Section id="guide-topics"><Container>
        <div className="guide-section-heading"><h2>Choose a subject relevant to your work.</h2><Link href="/classes" className="ink-link focus-ring">All activities <ArrowUpRight size={18} /></Link></div>
        {categories.length ? <div className="guide-topic-grid">{categories.map(category => <Link key={category.id} href={"/classes?country="+category.country+"&category="+encodeURIComponent(category.slug)} className="guide-topic-card focus-ring">
          <span className="guide-topic-country">{names.get(category.country) ?? category.country}</span>
          <h3>{category.name}</h3>
          {category.shortDescription && <p>{category.shortDescription}</p>}
          <span className="guide-topic-action">Browse this topic <ArrowUpRight size={18} /></span>
        </Link>)}</div> : <div className="mt-8"><EmptyState title="No catalogue topics are currently available." description="Categories will appear as soon as they are published." /></div>}
      </Container></Section>
      <Section id="guide-formats"><Container>
        <div className="guide-section-heading"><h2>A format that suits your schedule.</h2></div>
        <p className="guide-section-description">Activity listings show the delivery method, presenter, time and CPD value where available.</p>
        <div className="guide-format-list">{activityTypes.length ? activityTypes.map(activity => <Link key={activity.value} href={"/classes?type="+encodeURIComponent(activity.value)} className="guide-format-card focus-ring">
          <span><strong>{activity.value}</strong><span>{activity.count} published {activity.count === 1 ? "activity" : "activities"}</span></span><ArrowRight size={20} />
        </Link>) : <EmptyState title="Formats will appear here." description="No activity types are attached to published classes yet." />}</div>
      </Container></Section>
      <Section id="guide-sources"><Container>
        <div className="guide-section-heading"><h2>Official sources and references.</h2></div>
        <p className="guide-section-description">Links support traceability, not accreditation or endorsement. Professional requirements can change; check the authority relevant to your practice.</p>
        <div className="guide-source-list">{sources.length ? sources.map(reference => <article key={reference.id} className="guide-source-card">
          <div><a href={reference.url} target="_blank" rel="noreferrer" className="focus-ring">{reference.title}<ArrowUpRight size={18} className="shrink-0" /></a><p>{reference.authority} · Checked {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(reference.checkedAt)}</p></div>
        </article>) : <EmptyState title="Source references will appear here." description="No public reference records are available yet." />}</div>
      </Container></Section>
      <Section className="guide-cta"><Container className="flex flex-wrap items-center justify-between gap-8"><div><h2 className="max-w-3xl">A better learning plan starts with a clear next step.</h2><p className="mt-5 max-w-xl text-sm leading-7">Explore upcoming classes and check details before securing your place.</p></div><LinkButton href="/classes" variant="secondary">Browse classes <ArrowUpRight size={18} className="ml-3" /></LinkButton></Container></Section>
    </div>
  </div>;
}
