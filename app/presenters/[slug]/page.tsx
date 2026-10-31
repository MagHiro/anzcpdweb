import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { ClassCard, Container, EmptyState, LinkButton, Section } from "@/components/ui";
import { getPresenterBySlug, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const presenter = await getPresenterBySlug(slug).catch(() => null);
  return presenter ? { title: presenter.name, description: presenter.bio } : { title: "Presenter not found" };
}

export default async function PresenterPage({ params }: { params: Params }) {
  const { slug } = await params;
  const presenter = await getPresenterBySlug(slug).catch(() => null);
  if (!presenter) notFound();
  const classes = await getPublishedClasses({ presenterSlug: presenter.slug, time: "upcoming", pageSize: 12 }).catch(() => []);
  return <>
    <Section className="border-b border-[var(--line)]">
      <Container className="grid gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12">
        <div aria-hidden="true" className="flex h-36 w-36 items-center justify-center rounded-full bg-[var(--mist)] text-4xl font-semibold text-[var(--forest)] md:h-44 md:w-44">{presenter.initials}</div>
        <div>
          <Link href="/presenters" className="ink-link">← All presenters</Link>
          <h1 className="display mt-6">{presenter.name}</h1>
          <p className="mt-4 text-lg">{presenter.role}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{presenter.location}</p>
          <p className="mt-6 max-w-2xl leading-8 text-[var(--muted)]">{presenter.bio}</p>
        </div>
      </Container>
    </Section>
    <Section><Container className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <h2 className="!text-lg">Areas of focus</h2>
        <ul className="mt-5 space-y-3 text-sm text-[var(--muted)]">{presenter.expertise.map(item => <li key={item}>{item}</li>)}</ul>
        <LinkButton href="/classes" variant="secondary" className="mt-8">All activities <ArrowRight className="ml-2" size={16} /></LinkButton>
      </aside>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-5"><h2>Current activities</h2><Link href="/presenters" className="ink-link">All presenters <ArrowUpRight size={16} /></Link></div>
        <div className="mt-8">{classes.length ? <div className="grid gap-6 md:grid-cols-2">{classes.map(item => <ClassCard key={item.id} item={item} />)}</div> : <EmptyState title="No upcoming activities yet." description="Published classes assigned to this presenter will appear here when they are ready." />}</div>
      </div>
    </Container></Section>
  </>;
}
