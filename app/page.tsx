import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { HeroMotion, Reveal } from "@/components/animations";
import { CourseCard } from "@/components/course-card";
import { ClassCard, Container, LinkButton, Section } from "@/components/ui";
import { cpdActivityGuide, featuredCourses } from "@/lib/domain/cpd";
import { getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";

const guideTone = {
  coral: "bg-[#fff4ef] text-[#a7472b]",
  blue: "bg-[#f1f7fb] text-[#2d617d]",
  gold: "bg-[#fff8e9] text-[#97691a]",
  green: "bg-[#eef7f1] text-[#21604b]",
};

export default async function HomePage() {
  let liveClasses: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  try { liveClasses = await getPublishedClasses({ time: "upcoming", pageSize: 3 }); } catch { liveClasses = []; }

  return <>
    <HeroMotion>
      <section className="relative overflow-hidden bg-[var(--forest)] text-white">
        <div data-hero-orb className="pointer-events-none absolute -right-28 -top-28 h-[30rem] w-[30rem] rounded-full border border-[#91b5a5]/30" />
        <div className="pointer-events-none absolute right-20 top-16 h-72 w-72 rounded-full border border-[#91b5a5]/20" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 h-96 w-96 rounded-full bg-[#d96e4c]/15 blur-3xl" />
        <Container className="relative grid min-h-[650px] items-center gap-14 py-20 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="max-w-3xl">
            <p data-hero-line className="eyebrow text-[#b9d6c7]">AUSTRALIA <span className="mx-1 text-[#d96e4c]">/</span> NEW ZEALAND <span className="mx-1 text-[#d96e4c]">/</span> CPD</p>
            <h1 data-hero-line className="display mt-7 max-w-4xl text-[4.25rem] leading-[.91] tracking-[-.06em] sm:text-7xl lg:text-[7.15rem]">Keep your practice moving.</h1>
            <p data-hero-meta className="mt-8 max-w-xl text-base leading-7 text-[#c5d8ce] sm:text-lg">Focused professional development for migration agents and licensed immigration advisers. Choose a format, understand the points, and keep a record you can trust.</p>
            <div data-hero-meta className="mt-9 flex flex-wrap gap-3"><LinkButton href="/courses" className="bg-[#e87954] text-white hover:bg-[#f28c68]">Explore CPD activities <ArrowRight className="ml-2" size={17} /></LinkButton><LinkButton href="/australia" variant="secondary" className="border-[#8caf9f] text-white hover:bg-[#2b5a50]">Choose a country</LinkButton></div>
            <div data-hero-meta className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-[#4d7468] pt-5 text-xs font-semibold text-[#b9d6c7]"><span><strong className="text-white">4</strong> recognised activity formats</span><span><strong className="text-white">AU + NZ</strong> professional contexts</span><span><strong className="text-white">Secure</strong> online registration</span></div>
          </div>
          <div data-hero-meta className="relative mx-auto w-full max-w-[430px] lg:mr-0">
            <div className="absolute -left-8 top-10 hidden h-16 w-16 rounded-full border border-[#e87954] sm:block" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-[#608779] bg-[#214b43] p-6 shadow-[0_25px_80px_rgba(0,0,0,.18)] sm:p-8">
              <div className="flex items-start justify-between gap-6"><div><p className="eyebrow text-[#a9cfc0]">Your CPD year</p><p className="display mt-3 text-4xl text-white">A clear way through.</p></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e87954] text-sm font-black text-white">26</span></div>
              <div className="mt-9 space-y-3"><div className="flex items-center justify-between rounded-xl bg-[#2d5e53] px-4 py-3"><span className="text-sm text-[#dce8e1]">Category A</span><span className="text-sm font-bold text-white">Live learning <span className="ml-2 text-[#e87954]">↗</span></span></div><div className="flex items-center justify-between rounded-xl bg-[#2d5e53] px-4 py-3"><span className="text-sm text-[#dce8e1]">Category B</span><span className="text-sm font-bold text-white">Independent study <span className="ml-2 text-[#e87954]">↗</span></span></div></div>
              <div className="mt-7 border-t border-[#4d7468] pt-6"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#a9cfc0]">Start with the right question</p><p className="mt-3 max-w-xs text-sm leading-6 text-[#dce8e1]">What do you need to understand, and which activity gives you the best evidence of learning?</p></div>
              <div className="absolute -bottom-14 -right-14 h-36 w-36 rounded-full border border-[#e87954]/50" />
            </div>
          </div>
        </Container>
      </section>
    </HeroMotion>

    <Section className="bg-[#fbfaf6]"><Container><div className="grid gap-10 lg:grid-cols-[.68fr_1.32fr]"><Reveal><p className="eyebrow text-[var(--fern)]">Choose your format</p><h2 className="display mt-4 max-w-md text-4xl leading-[1.02] text-[var(--forest)] sm:text-5xl">CPD that fits the work.</h2><p className="mt-5 max-w-sm text-base leading-7 text-[var(--muted)]">The activity matters. So does the way you learn it. Browse by the structure that best supports your practice.</p><Link href="/cpd-requirements" className="focus-ring mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--forest)] underline decoration-[#e87954] underline-offset-4">Read the full activity guide <ArrowUpRight size={16} /></Link></Reveal><div className="grid gap-3 sm:grid-cols-2">{cpdActivityGuide.map((item) => <Reveal key={item.number}><Link href="/cpd-requirements" className="group block rounded-[1.25rem] border border-[var(--line)] bg-white p-5 transition hover:-translate-y-1 hover:border-[#a9c7bd] hover:shadow-[0_14px_38px_rgba(23,60,55,.07)]"><div className="flex items-start justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black ${guideTone[item.tone]}`}>{item.number}</span><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">{item.category}</span></div><h3 className="mt-7 text-lg font-bold text-[var(--forest)]">{item.type}</h3><p className="mt-2 text-sm font-bold text-[#d26648]">{item.rule}</p><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.detail}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[var(--forest)] group-hover:text-[var(--fern)]">How it works <ArrowRight size={14} /></span></Link></Reveal>)}</div></div></Container></Section>

    <Section className="bg-white"><Container><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow text-[var(--fern)]">The next dates</p><h2 className="display mt-3 text-4xl text-[var(--forest)] sm:text-5xl">Find your next activity.</h2></div><LinkButton href="/courses" variant="quiet">View all activities <ArrowRight className="ml-2" size={16} /></LinkButton></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{featuredCourses.slice(0, 3).map((course) => <Reveal key={course.slug}><CourseCard course={course} /></Reveal>)}</div></Container></Section>

    {liveClasses.length ? <Section className="bg-[var(--mist)]"><Container><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow text-[var(--fern)]">Live booking inventory</p><h2 className="display mt-3 text-4xl text-[var(--forest)] sm:text-5xl">Ready to reserve.</h2></div><LinkButton href="/classes" variant="secondary">Open booking catalogue <ArrowRight className="ml-2" size={16} /></LinkButton></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{liveClasses.map((item) => <Reveal key={item.id}><ClassCard item={item} /></Reveal>)}</div></Container></Section> : null}

    <Section id="about" className="bg-[#edf3ef]"><Container><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><Reveal><p className="eyebrow text-[var(--fern)]">A better CPD record starts here</p><h2 className="display mt-4 max-w-xl text-4xl leading-[1.02] text-[var(--forest)] sm:text-6xl">Useful learning. Clear records. Less admin.</h2><p className="mt-6 max-w-lg text-base leading-7 text-[#52635d]">ANZ Migration Academy brings the activity details together before you book: category, format, time commitment, presenter and points. After registration, your secure account keeps the record in one place.</p><Link href="/register" className="focus-ring mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--forest)] underline decoration-[#e87954] underline-offset-4">Create your account <ArrowUpRight size={16} /></Link></Reveal><Reveal><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-[1.25rem] bg-white p-5"><span className="display text-4xl text-[#d26648]">01</span><h3 className="mt-7 text-sm font-bold text-[var(--forest)]">See the value</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Know exactly how the activity is counted.</p></div><div className="rounded-[1.25rem] bg-white p-5"><span className="display text-4xl text-[#d26648]">02</span><h3 className="mt-7 text-sm font-bold text-[var(--forest)]">Book securely</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Reserve a place through protected checkout.</p></div><div className="rounded-[1.25rem] bg-white p-5"><span className="display text-4xl text-[#d26648]">03</span><h3 className="mt-7 text-sm font-bold text-[var(--forest)]">Keep the record</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Return to your account when you need it.</p></div></div></Reveal></div></Container></Section>

    <Section className="bg-[var(--forest)] text-white"><Container><div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow text-[#a9cfc0]">Need a clearer plan?</p><h2 className="display mt-4 max-w-3xl text-4xl leading-[1.02] text-white sm:text-6xl">Start with the activity guide.</h2><p className="mt-5 max-w-xl text-base leading-7 text-[#c5d8ce]">Compare Category A and Category B formats, then choose the next useful piece of learning for your practice.</p></div><LinkButton href="/cpd-requirements" className="bg-[#e87954] text-white hover:bg-[#f28c68]">View CPD requirements <ArrowUpRight className="ml-2" size={17} /></LinkButton></div></Container></Section>
  </>;
}
