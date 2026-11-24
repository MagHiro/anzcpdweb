import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { ClassCard, Container, EmptyState, LinkButton, Section } from "@/components/ui";
import { getCategories, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let classes: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let unavailable = false;
  try { [classes, categories] = await Promise.all([getPublishedClasses({ time: "upcoming", pageSize: 4 }), getCategories()]); } catch { unavailable = true; }
  const topics = categories.slice(0, 6);
  const jurisdictions = [{ code: "AU", name: "Australia" }, { code: "NZ", name: "New Zealand" }] as const;
  return <>
    <section className="home-hero"><Container className="home-hero-layout">
      <div className="home-intro">
        <h1>CPD for <span>migration practice</span></h1>
        <p>CPD classes for registered migration agents (RMAs), licensed immigration advisers (LIAs), and legal practices in Australia and New Zealand.</p>
        <div className="home-hero-actions">
          <Link href="/classes" className="home-hero-primary focus-ring">Browse classes <ArrowUpRight size={18} /></Link>
          <Link href="/cpd-requirements" className="home-hero-secondary focus-ring">CPD requirements <ArrowRight size={16} /></Link>
        </div>
      </div>
      <svg className="home-hero-art" viewBox="0 0 420 300" fill="none" aria-hidden="true" focusable="false">
        <path d="M10 225C67 265 145 278 220 261S363 197 410 121" stroke="#80ae99" strokeOpacity=".55" strokeDasharray="3 7" strokeLinecap="round" />
        <circle cx="350" cy="82" r="62" fill="#bce7d3" />
        <g transform="rotate(-13 176 149)">
          <rect x="104" y="45" width="144" height="208" rx="14" fill="#467b67" stroke="#a5cbbb" />
          <path d="M127 212V81a12 12 0 0 1 12-12h79" stroke="#a5cbbb" strokeOpacity=".7" />
        </g>
        <g transform="rotate(11 238 148)">
          <path d="M174 40h92l46 46v155a12 12 0 0 1-12 12H174a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12Z" fill="#e3f3eb" />
          <path d="M266 40v34a12 12 0 0 0 12 12h34L266 40Z" fill="#a2cbb9" />
          <path d="M189 104h47" stroke="#285443" strokeWidth="4" strokeLinecap="round" />
          <path d="M189 127h94m-94 15h79m-79 15h86" stroke="#80aa99" strokeWidth="2" strokeLinecap="round" />
          <circle cx="261" cy="206" r="21" stroke="#467b67" strokeWidth="1.5" />
          <path d="m253 206 5 5 11-11" stroke="#467b67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="49" cy="246" r="5" fill="#bce7d3" />
      </svg>
    </Container></section>
    <section className="home-classes" aria-labelledby="home-classes-title">
      <Container>
        <div className="home-classes-header">
          <h2 id="home-classes-title">Upcoming classes</h2>
          <Link href="/classes" className="home-classes-link focus-ring">View all classes <ArrowUpRight size={18} /></Link>
        </div>
        {classes.length ? <div className="class-schedule-grid">
          {classes.map(item => <ClassCard key={item.id} item={item} variant="schedule" />)}
        </div> : <EmptyState title={unavailable ? "Classes are temporarily unavailable" : "No upcoming classes"} description={unavailable ? "Try again shortly." : "Check back for new dates, or see the CPD guide."} action={<LinkButton href={unavailable ? "/classes" : "/cpd-requirements"} variant="secondary">{unavailable ? "Open the catalogue" : "Read the CPD guide"}</LinkButton>} />}
      </Container>
    </section>
    <Section aria-labelledby="home-topics-title"><Container>
      <div className="home-topics">
        <div className="home-topics-intro">
          <h2 id="home-topics-title">Browse by topic</h2>
          <Link href="/cpd-requirements" className="ink-link focus-ring">CPD guide <ArrowUpRight size={17} /></Link>
        </div>
        <div className="home-topics-directory">
          {topics.length ? jurisdictions.map(({ code, name }) => {
            const entries = topics.filter(topic => topic.country === code);
            return entries.length > 0 && <div key={code}>
              <h3>{name}</h3>
              <ul>{entries.map(topic => <li key={topic.id}>
                <Link href={{ pathname: "/classes", query: { country: code, category: topic.slug } }} className="home-topic-link focus-ring">
                  <span>{topic.name}</span><span className="home-topic-arrow"><ArrowUpRight size={16} /></span>
                </Link>
              </li>)}</ul>
            </div>;
          }) : <p>{unavailable ? "Topics are temporarily unavailable." : "No topics listed yet."}</p>}
        </div>
      </div>
    </Container></Section>
    <Section aria-labelledby="home-account-title"><Container>
      <div className="home-account-panel">
        <div>
          <h2 id="home-account-title">Already booked?</h2>
          <p>Sign in to see your bookings, download receipts and access class materials and recordings when they’re available.</p>
        </div>
        <Link href="/account" className="site-signin focus-ring">My account <span className="site-signin-arrow"><ArrowUpRight size={16} /></span></Link>
      </div>
    </Container></Section>
  </>;
}
