import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { Container, EmptyState, Section } from "@/components/ui";
import { getPresenters } from "@/server/catalogue/queries";
import { presenterInitials } from "@/lib/presenter-initials";
export const metadata: Metadata = { title: "Presenters", description: "Meet the migration professionals and facilitators behind ANZ Migration Academy CPD activities." };
export const dynamic = "force-dynamic";
export default async function PresentersPage() {
  let unavailable = false;
  let profiles: Awaited<ReturnType<typeof getPresenters>> = [];
  try { profiles = await getPresenters(); } catch { unavailable = true; }
  return <>
    <section className="presenters-introduction"><Container><h1>Our presenters</h1></Container></section>
    <Section className="presenters-list"><Container>
      {profiles.length ? <div className="presenters-grid">{profiles.map(presenter => <article key={presenter.slug} className="presenter-profile-card">
        <div className="presenter-profile-heading"><span className="presenter-profile-avatar" aria-hidden="true">{presenterInitials(presenter.name)}</span><div className="min-w-0"><h2>{presenter.name}</h2>{presenter.role && <p>{presenter.role}</p>}</div></div>
        {presenter.bio && <p className="presenter-profile-bio">{presenter.bio}</p>}
        {presenter.expertise.length > 0 && <ul className="presenter-profile-expertise" aria-label="Expertise">{presenter.expertise.slice(0,3).map(skill => <li key={skill}>{skill}</li>)}</ul>}
        <Link href={"/presenters/"+presenter.slug} className="presenter-profile-link focus-ring" aria-label={`View profile: ${presenter.name}`}>View profile <ArrowUpRight size={18} /></Link>
      </article>)}</div> : <EmptyState title={unavailable ? "We couldn’t load our presenters." : "No presenters published yet."} description={unavailable ? "Please try again shortly." : ""} />}
      <div className="presenters-contact"><h2>Present with the academy</h2><a href="mailto:info@anzmigrationacademy.com" className="ink-link focus-ring">Contact us <ArrowUpRight size={18} /></a></div>
    </Container></Section>
  </>;
}
