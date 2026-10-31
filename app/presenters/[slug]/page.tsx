import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { ClassCard, Container, EmptyState, Section } from "@/components/ui";
import { getPresenterBySlug, getPublishedClasses } from "@/server/catalogue/queries";
import { presenterInitials } from "@/lib/presenter-initials";

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
    <section className="presenter-detail-hero"><Container>
      <Link href="/presenters" className="class-back-link focus-ring">← All presenters</Link>
      <div className="presenter-detail-identity"><div className="presenter-detail-avatar" aria-hidden="true">{presenterInitials(presenter.name)}</div><div className="min-w-0"><h1>{presenter.name}</h1>{presenter.role && <p className="presenter-detail-role">{presenter.role}</p>}{presenter.location && <p className="presenter-detail-location">{presenter.location}</p>}</div></div>
    </Container></section>
    <Section><Container className="presenter-detail-layout">
      <aside className="presenter-detail-about">
        <h2>About {presenter.name.split(" ")[0]}</h2>
        {presenter.bio && <p className="presenter-detail-bio">{presenter.bio}</p>}
        {presenter.expertise.length > 0 && <div className="presenter-detail-focus"><h3>Areas of focus</h3><ul className="presenter-profile-expertise">{presenter.expertise.map(item => <li key={item}>{item}</li>)}</ul></div>}
      </aside>
      <div className="min-w-0">
        <div className="presenter-activities-heading"><h2>Upcoming activities</h2><Link href="/classes" className="ink-link focus-ring">All activities <ArrowUpRight size={18} /></Link></div>
        <div className="mt-7">{classes.length ? <div className="grid gap-6 md:grid-cols-2">{classes.map(item => <ClassCard key={item.id} item={item} />)}</div> : <EmptyState title="No upcoming activities." description="" />}</div>
      </div>
    </Container></Section>
  </>;
}
