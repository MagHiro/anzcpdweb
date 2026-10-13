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
function HeroArtwork() {
  return <div className="hero-visual" data-float>
    <div className="hero-orbit hero-orbit-right"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#7ca17a]" /> Built for migration professionals</div>
    <div className="hero-poster">
      <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#617966]">ANZ / Academy</span><span className="rounded-full bg-[#e5efde] px-3 py-1.5 text-[10px] font-semibold text-[#366047]">CPD learning</span></div>
      <p className="mt-11 text-[14px] font-medium text-[#728373]">Your learning, in motion.</p>
      <p className="mt-2 text-[38px] font-semibold leading-[1.05] tracking-[-.065em] text-[#244c3b]">Progress<br />with purpose.</p>
      <svg viewBox="0 0 330 152" fill="none" role="img" aria-label="Illustration of a rising learning pathway with milestones" className="mt-8">
        <path d="M0 133H330" stroke="#e5ebe0" strokeWidth="2" />
        <path d="M8 125C54 125 54 97 103 105S160 82 191 84 243 44 280 38 312 18 327 15" stroke="#b5ceb3" strokeWidth="21" strokeLinecap="round" />
        <path d="M8 125C54 125 54 97 103 105S160 82 191 84 243 44 280 38 312 18 327 15" stroke="#316b51" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" />
        <circle cx="103" cy="105" r="12" fill="#fffefa" stroke="#316b51" strokeWidth="3" /><path d="m98 105 4 4 6-8" stroke="#316b51" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="280" cy="38" r="12" fill="#244c3b" /><path d="m275 38 3.5 3.5L285 34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="poster-divider" />
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#566c5b]"><span>Australia & New Zealand</span><span>Learn. Apply. Grow. ↗</span></div>
    </div>
    <div className="hero-orbit hero-orbit-left">✦ Knowledge for real practice</div>
  </div>;
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
    <section className="home-hero"><Container className="grid items-center gap-8 py-16 sm:py-24 lg:min-h-[710px] lg:grid-cols-[1.12fr_.88fr] lg:gap-12 lg:py-28">
      <div className="relative z-10"><p className="mb-7 text-sm font-semibold text-[#466a50]">Continuing professional development, thoughtfully delivered.</p><h1 className="max-w-4xl font-semibold text-[#244c3b]">Stay sharp.<br />Keep growing.<br /><span className="text-[#668968]">Go further.</span></h1><p className="mt-8 max-w-[550px] text-base leading-8 text-[#526b58] sm:text-lg">Practice-focused learning for migration agents and immigration advisers across Australia and New Zealand.</p><div className="mt-9 flex flex-wrap gap-3"><LinkButton href="/classes" size="lg" className="!rounded-full !px-7">Explore activities <ArrowUpRight size={18} className="ml-3" /></LinkButton><Link href="/cpd-requirements" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[#244c3b] hover:bg-white/40">How CPD works <ArrowRight size={16} /></Link></div></div>
      <HeroArtwork />
    </Container></section>
    <Section className="!py-14 sm:!py-18"><Container><div className="grid gap-8 lg:grid-cols-[.48fr_1fr] lg:items-center"><div><p className="text-sm font-medium text-[var(--fern)]">Two countries. One learning mindset.</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[var(--forest)] sm:text-4xl">Your practice, your path.</h2></div><div className="grid gap-4 sm:grid-cols-2"><Link href="/australia" className="pathway-card group"><span className="text-xs font-semibold text-[var(--fern)]">Australia</span><strong className="!mt-3 !text-[1.45rem] !font-semibold !tracking-[-.04em]">Migration practice</strong><p>Professional learning for registered migration agents.</p><span className="ink-link mt-5">Explore Australia <ArrowUpRight size={16} /></span></Link><Link href="/new-zealand" className="pathway-card group"><span className="text-xs font-semibold text-[var(--fern)]">New Zealand</span><strong className="!mt-3 !text-[1.45rem] !font-semibold !tracking-[-.04em]">Immigration advice</strong><p>Activities for licensed immigration advisers.</p><span className="ink-link mt-5">Explore New Zealand <ArrowUpRight size={16} /></span></Link></div></div></Container></Section>
    <Section className="bg-[#fffefa]"><Container><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-sm font-semibold text-[var(--fern)]">Upcoming learning</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Make your next move a meaningful one.</h2></div><Link href="/classes" className="ink-link">View all activities <ArrowUpRight size={19} /></Link></div><div className="mt-12">{classes.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{classes.map(item => <ClassCard key={item.id} item={item} />)}</div> : <EmptyState title={unavailable ? "The programme is temporarily unavailable." : "New activities are on their way."} description={unavailable ? "Please try again shortly, or contact the academy." : "Published sessions will appear here when new dates are confirmed. Explore the CPD guide in the meantime."} action={<LinkButton href={unavailable ? "/classes" : "/cpd-requirements"} variant="secondary">{unavailable ? "Try the catalogue" : "Explore the guide"}</LinkButton>} />}</div></Container></Section>
    <Section className="bg-[#e8efe2]"><Container className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><p className="text-sm font-semibold text-[var(--fern)]">What matters most</p><h2 className="mt-4 max-w-md text-4xl font-semibold tracking-[-.055em] text-[var(--forest)] sm:text-5xl">Learning that fits the work you do.</h2><p className="mt-6 max-w-sm text-sm leading-7 text-[var(--muted)]">From selecting a relevant topic to holding onto your booking details, we make the experience easier to navigate.</p></div><div className="grid gap-5 md:grid-cols-3">{advantages.map(advantage => <div key={advantage.title} className="py-5"><div className="icon-pill"><LearningGlyph kind={advantage.kind} /></div><h3 className="mt-6 text-xl font-semibold tracking-[-.03em]">{advantage.title}</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{advantage.body}</p></div>)}</div></Container></Section>
    <Section><Container className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-sm font-semibold text-[var(--fern)]">Explore by topic</p><h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-.055em] text-[var(--forest)] sm:text-5xl">Find what’s relevant to your next chapter.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-[var(--muted)]">Browse the subjects available in the academy catalogue.</p><Link href="/cpd-requirements" className="ink-link mt-7">Understand the CPD guide <ArrowUpRight size={18} /></Link></div><div>{categories.length ? categories.slice(0, 6).map((category, index) => <Link key={category.id} href={"/classes?country="+category.country+"&category="+encodeURIComponent(category.slug)} className="feature-row-link group"><span className="text-sm font-medium text-[#809080]">{String(index + 1).padStart(2,"0")}</span><span className="flex-1 text-lg font-semibold tracking-[-.025em] sm:text-xl">{category.name}</span><span className="text-xs text-[var(--muted)]">{category.country === "AU" ? "AU" : "NZ"}</span><ArrowUpRight size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>) : <div className="soft-card rounded-[1.25rem] bg-white p-8"><h3 className="text-xl font-semibold">A clearer place to start.</h3><p className="mt-3 text-sm leading-7 text-[var(--muted)]">Discover activity types, source references and what to check before booking.</p><Link href="/cpd-requirements" className="ink-link mt-6">Read the guide <ArrowUpRight size={17} /></Link></div>}</div></Container></Section>
    <Section className="bg-[var(--forest)] text-white"><Container className="grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]"><div><h2 className="max-w-3xl text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Clarity for every stage of your professional journey.</h2><p className="mt-6 max-w-xl text-base leading-8 text-[#bed3c3]">Explore the programme, reserve a place and keep your learning organised in one secure account.</p></div><div className="flex flex-col gap-4 lg:items-end"><LinkButton href="/classes" className="!rounded-full !bg-[#d8e7c7] !px-8 !text-[#244c3b] hover:!bg-white">Browse CPD classes <ArrowUpRight size={18} className="ml-3" /></LinkButton><Link href="/complaints" className="text-sm text-[#c5d7c7] underline underline-offset-4">Questions or concerns? We can help.</Link></div></Container></Section>
  </>;
}
