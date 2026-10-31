import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { ClassCard, Container, EmptyState, LinkButton, Section } from "@/components/ui";
import { getCategories, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";

function LearningGlyph({ kind }: { kind: "compass" | "calendar" | "archive" }) {
  const paths = {
    compass: <><circle cx="24" cy="24" r="17" /><path d="m31 17-4 11-10 3 4-10 10-4Z" /></>,
    calendar: <><rect x="9" y="11" width="30" height="28" rx="4" /><path d="M16 7v8M32 7v8M9 21h30M17 28h8M17 33h13" /></>,
    archive: <><path d="M9 14h30v26H9zM6 8h36v7H6zM20 27h8" /><path d="m20 33 3 3 6-7" /></>,
  };
  return <svg aria-hidden="true" width="29" height="29" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}
const advantages = [
  { kind: "compass" as const, title: "Find your focus", body: "Choose learning aligned with the questions, decisions and responsibilities you handle every day." },
  { kind: "calendar" as const, title: "Learn on your terms", body: "See the presenter, delivery format, timezone and CPD value before you reserve a place." },
  { kind: "archive" as const, title: "Keep track with ease", body: "Secure bookings and activity details stay close, so there is less to organise afterwards." },
];

export default async function HomePage() {
  let classes: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let unavailable = false;
  try { [classes, categories] = await Promise.all([getPublishedClasses({ time: "upcoming", pageSize: 3 }), getCategories()]); } catch { unavailable = true; }
  return <>
    <section className="home-hero"><Container>
      <div className="home-intro"><h1>Stay sharp.<br />Keep growing. Go further.</h1><p className="mt-6 max-w-xl text-lg leading-7">Practice-focused learning for migration agents and immigration advisers across Australia and New Zealand.</p><div className="mt-8 flex flex-wrap items-center gap-6"><LinkButton href="/classes" size="lg" className="!bg-white !text-[var(--forest)]">Explore activities <ArrowUpRight size={18} className="ml-3" /></LinkButton><Link href="/cpd-requirements" className="text-sm text-white underline underline-offset-4">Understand your CPD <ArrowRight size={16} className="ml-2 inline" /></Link></div></div>
      <div className="home-pathways"><div className="hero-media"><div className="hero-path"><h2>Australia.<br />Migration practice.</h2><div><p>Professional learning for registered migration agents.</p><Link href="/australia">Explore Australia <ArrowUpRight size={18} /></Link></div></div><div className="hero-path"><h2>New Zealand.<br />Immigration advice.</h2><div><p>Activities for licensed immigration advisers.</p><Link href="/new-zealand">Explore New Zealand <ArrowUpRight size={18} /></Link></div></div></div></div>
    </Container></section>
    <Section className="bg-[#fffefa]"><Container><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-sm font-semibold text-[var(--fern)]">Upcoming learning</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Make your next move a meaningful one.</h2></div><Link href="/classes" className="ink-link">View all activities <ArrowUpRight size={19} /></Link></div><div className="mt-12">{classes.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{classes.map(item => <ClassCard key={item.id} item={item} />)}</div> : <EmptyState title={unavailable ? "The programme is temporarily unavailable." : "New activities are on their way."} description={unavailable ? "Please try again shortly, or contact the academy." : "Published sessions will appear here when new dates are confirmed. Explore the CPD guide in the meantime."} action={<LinkButton href={unavailable ? "/classes" : "/cpd-requirements"} variant="secondary">{unavailable ? "Try the catalogue" : "Explore the guide"}</LinkButton>} />}</div></Container></Section>
    <Section className="bg-[#e8efe2]"><Container className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><p className="text-sm font-semibold text-[var(--fern)]">What matters most</p><h2 className="mt-4 max-w-md text-4xl font-semibold tracking-[-.055em] text-[var(--forest)] sm:text-5xl">Learning that fits the work you do.</h2><p className="mt-6 max-w-sm text-sm leading-7 text-[var(--muted)]">From selecting a relevant topic to holding onto your booking details, we make the experience easier to navigate.</p></div><div className="grid gap-5 md:grid-cols-3">{advantages.map(advantage => <div key={advantage.title} className="py-5"><div className="icon-pill"><LearningGlyph kind={advantage.kind} /></div><h3 className="mt-6 text-xl font-semibold tracking-[-.03em]">{advantage.title}</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{advantage.body}</p></div>)}</div></Container></Section>
    <Section><Container className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-sm font-semibold text-[var(--fern)]">Explore by topic</p><h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-.055em] text-[var(--forest)] sm:text-5xl">Find what’s relevant to your next chapter.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-[var(--muted)]">Browse the subjects available in the academy catalogue.</p><Link href="/cpd-requirements" className="ink-link mt-7">Understand the CPD guide <ArrowUpRight size={18} /></Link></div><div>{categories.length ? categories.slice(0, 6).map((category, index) => <Link key={category.id} href={"/classes?country="+category.country+"&category="+encodeURIComponent(category.slug)} className="feature-row-link group"><span className="text-sm font-medium text-[#809080]">{String(index + 1).padStart(2,"0")}</span><span className="flex-1 text-lg font-semibold tracking-[-.025em] sm:text-xl">{category.name}</span><span className="text-xs text-[var(--muted)]">{category.country === "AU" ? "AU" : "NZ"}</span><ArrowUpRight size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>) : <div className="soft-card rounded-[1.25rem] bg-white p-8"><h3 className="text-xl font-semibold">A clearer place to start.</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Discover activity types, source references and what to check before booking.</p><Link href="/cpd-requirements" className="ink-link mt-6">Read the guide <ArrowUpRight size={17} /></Link></div>}</div></Container></Section>
    <Section className="bg-[var(--forest)] text-white"><Container className="grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]"><div><h2 className="max-w-3xl">Clarity for every stage of your professional journey.</h2><p className="mt-6 max-w-xl text-base leading-8 text-[#def6eb]">Explore the programme, reserve a place and keep your learning organised in one secure account.</p></div><div className="flex flex-col gap-4 lg:items-end"><LinkButton href="/classes" variant="secondary">Browse CPD classes <ArrowUpRight size={18} className="ml-3" /></LinkButton><Link href="/complaints" className="text-sm text-[#def6eb] underline underline-offset-4">Questions or concerns? We can help.</Link></div></Container></Section>
  </>;
}
