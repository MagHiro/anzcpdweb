import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/icon";
import { HeroMotion, Reveal } from "@/components/animations";
import { ClassCard, Container, EmptyState, LinkButton, Section } from "@/components/ui";
import { getCategories, getCountries, getPublishedActivityTypes, getPublishedClasses } from "@/server/catalogue/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let liveClasses: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let countries: Awaited<ReturnType<typeof getCountries>> = [];
  let activityTypes: Awaited<ReturnType<typeof getPublishedActivityTypes>> = [];
  try {
    [liveClasses, categories, countries, activityTypes] = await Promise.all([
      getPublishedClasses({ time: "upcoming", pageSize: 3 }),
      getCategories(),
      getCountries(),
      getPublishedActivityTypes(),
    ]);
  } catch {
    liveClasses = [];
    categories = [];
    countries = [];
    activityTypes = [];
  }
  const countryNames = new Map(countries.map((country) => [country.code, country.name]));

  return <>
    <HeroMotion>
      <section className="grain relative overflow-hidden bg-[var(--forest)] text-white">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />
        <div className="pointer-events-none absolute -right-36 -top-48 h-[38rem] w-[38rem] rounded-full border border-[#8fb3a5]/25" />
        <div className="pointer-events-none absolute right-24 top-16 h-64 w-64 rounded-full border border-[#8fb3a5]/15" />
        <div data-hero-art className="pointer-events-none absolute -bottom-48 left-[44%] h-[30rem] w-[30rem] rounded-full bg-[var(--signal)]/20 blur-3xl" />
        <Container className="relative grid min-h-[690px] items-center gap-16 py-20 lg:grid-cols-[1.08fr_.92fr] lg:py-28">
          <div className="max-w-3xl">
            <p data-hero-line className="eyebrow text-[#bdd8cc]">Australia <span className="mx-1 text-[var(--signal)]">/</span> New Zealand <span className="mx-1 text-[var(--signal)]">/</span> CPD</p>
            <h1 data-hero-line className="display mt-7 max-w-4xl text-[4.2rem] leading-[.9] tracking-[-.065em] sm:text-7xl lg:text-[7.6rem]">Make the next move with more certainty.</h1>
            <p data-hero-meta className="mt-8 max-w-xl text-base leading-7 text-[#c9ddd5] sm:text-lg">Source-led professional development for migration agents and licensed immigration advisers. Find the right activity, book securely, and keep the record close.</p>
            <div data-hero-meta className="mt-9 flex flex-wrap gap-3"><LinkButton href="/courses" className="bg-[var(--signal)] text-white hover:bg-[#e88b6d]">Explore the catalogue <ArrowRight className="ml-2" size={17} /></LinkButton><LinkButton href="/australia" variant="secondary" className="border-[#91b3a6] text-white hover:bg-[#24564c]">Choose a country</LinkButton></div>
            <div data-hero-meta className="mt-12 grid max-w-xl grid-cols-3 border-t border-[#52786b] pt-5 text-xs font-semibold text-[#bdd8cc]"><span><strong className="block text-lg text-white">{activityTypes.length || "—"}</strong>catalogue formats</span><span><strong className="block text-lg text-white">{countries.length || "—"}</strong>professional contexts</span><span><strong className="block text-lg text-white">Secure</strong>online registration</span></div>
          </div>
          <div data-hero-meta className="relative mx-auto w-full max-w-[450px] lg:mr-0">
            <div className="absolute -left-8 top-10 hidden h-16 w-16 rounded-full border border-[var(--signal)] sm:block" />
            <div className="relative overflow-hidden rounded-[1.8rem] border border-[#648b7c] bg-[#214c43] p-6 shadow-[0_30px_90px_rgba(0,0,0,.22)] sm:p-8">
              <div className="flex items-start justify-between gap-6"><div><p className="eyebrow text-[#a9cfc0]">A clearer CPD year</p><p className="display mt-3 text-4xl text-white">One useful next step.</p></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--signal)] text-sm font-black text-white">01</span></div>
              <div className="mt-9 space-y-3">{categories.slice(0, 2).map((category) => <div key={category.id} className="flex items-center justify-between gap-4 rounded-xl bg-[#2d5e53] px-4 py-3"><span className="text-sm text-[#dce8e1]">{category.name}</span><span className="text-right text-xs font-bold text-white">{countryNames.get(category.country) ?? category.country} <span className="ml-2 text-[var(--signal)]">↗</span></span></div>)}{!categories.length ? <p className="rounded-xl bg-[#2d5e53] px-4 py-3 text-sm text-[#dce8e1]">Your next activity starts with a question worth answering.</p> : null}</div>
              <div className="mt-7 border-t border-[#52786b] pt-6"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#a9cfc0]">Designed for working professionals</p><p className="mt-3 max-w-xs text-sm leading-6 text-[#dce8e1]">Compare the details before you book: country, format, presenter, timing and CPD value.</p></div>
              <div className="absolute -bottom-14 -right-14 h-36 w-36 rounded-full border border-[var(--signal)]/50" />
            </div>
          </div>
        </Container>
      </section>
    </HeroMotion>

    <Section className="bg-[var(--paper)]"><Container><div className="grid gap-10 lg:grid-cols-[.63fr_1.37fr] lg:items-start"><Reveal><p className="eyebrow text-[var(--fern)]">Find your focus</p><h2 className="display mt-4 max-w-md text-4xl leading-[1.02] text-[var(--forest)] sm:text-5xl">Learning that respects the work around you.</h2><p className="mt-5 max-w-sm text-base leading-7 text-[var(--muted)]">Start with the subject, country or activity format that matches your next professional question.</p><Link href="/cpd-requirements" className="focus-ring mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--forest)] underline decoration-[var(--signal)] underline-offset-4">Read the catalogue guide <ArrowUpRight size={16} /></Link></Reveal><div className="grid gap-3 sm:grid-cols-2">{categories.slice(0, 4).map((category, index) => <Reveal key={category.id}><Link href={`/courses?country=${category.country}&category=${encodeURIComponent(category.slug)}`} className="card-lift group block rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(18,36,31,.03)]"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--signal-soft)] text-[11px] font-black text-[var(--signal)]">{String(index + 1).padStart(2, "0")}</span><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">{countryNames.get(category.country) ?? category.country}</span></div><h3 className="mt-7 text-lg font-bold text-[var(--forest)]">{category.name}</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{category.shortDescription ?? "Explore published CPD classes in this catalogue category."}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[var(--forest)] group-hover:text-[var(--fern)]">View classes <ArrowRight size={14} /></span></Link></Reveal>)}{!categories.length ? <div className="sm:col-span-2"><EmptyState eyebrow="Catalogue opening soon" title="The next useful subject is being prepared." description="Published categories will appear here as the catalogue is released. You can still read how the catalogue is structured or contact the academy." action={<LinkButton href="/cpd-requirements" variant="secondary">View the guide</LinkButton>} /></div> : null}</div></div></Container></Section>

    <Section className="bg-[var(--surface)]"><Container><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow text-[var(--fern)]">The next dates</p><h2 className="display mt-3 text-4xl text-[var(--forest)] sm:text-5xl">Choose your next activity.</h2></div><LinkButton href="/courses" variant="quiet">View the full catalogue <ArrowRight className="ml-2" size={16} /></LinkButton></div>{liveClasses.length ? <div className="mt-10 grid gap-5 lg:grid-cols-3">{liveClasses.map((item) => <Reveal key={item.id}><ClassCard item={item} /></Reveal>)}</div> : <div className="mt-10"><EmptyState eyebrow="No live dates yet" title="The next dates will appear here." description="There are no upcoming published classes available right now. Check back soon or browse the catalogue guide to understand the available formats." action={<LinkButton href="/cpd-requirements" variant="secondary">Understand the formats</LinkButton>} /></div>}</Container></Section>

    <Section id="about" className="bg-[var(--mist)]"><Container><div className="grid gap-12 lg:grid-cols-[.83fr_1.17fr] lg:items-end"><Reveal><p className="eyebrow text-[var(--fern)]">A better CPD record starts here</p><h2 className="display mt-4 max-w-xl text-4xl leading-[1.02] text-[var(--forest)] sm:text-6xl">Clear decisions. Secure bookings. Less admin.</h2><p className="mt-6 max-w-lg text-base leading-7 text-[var(--muted)]">ANZ Migration Academy brings the activity details together before you book. After registration, your secure account keeps the record in one place.</p><Link href="/register" className="focus-ring mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--forest)] underline decoration-[var(--signal)] underline-offset-4">Create your account <ArrowUpRight size={16} /></Link></Reveal><Reveal><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-[1.25rem] bg-[var(--surface)] p-5"><span className="display text-4xl text-[var(--signal)]">01</span><h3 className="mt-7 text-sm font-bold text-[var(--forest)]">See the value</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Know how the activity is counted before you register.</p></div><div className="rounded-[1.25rem] bg-[var(--surface)] p-5"><span className="display text-4xl text-[var(--signal)]">02</span><h3 className="mt-7 text-sm font-bold text-[var(--forest)]">Book securely</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Reserve a place through protected checkout.</p></div><div className="rounded-[1.25rem] bg-[var(--surface)] p-5"><span className="display text-4xl text-[var(--signal)]">03</span><h3 className="mt-7 text-sm font-bold text-[var(--forest)]">Keep the record</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Return to your account when you need it.</p></div></div></Reveal></div></Container></Section>

    <Section className="bg-[var(--forest)] text-white"><Container><div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow text-[#a9cfc0]">Need a clearer plan?</p><h2 className="display mt-4 max-w-3xl text-4xl leading-[1.02] text-white sm:text-6xl">Start with the catalogue guide.</h2><p className="mt-5 max-w-xl text-base leading-7 text-[#c5d8ce]">Review the live categories, activity formats and official source references maintained for the catalogue.</p></div><LinkButton href="/cpd-requirements" className="bg-[var(--signal)] text-white hover:bg-[#e88b6d]">View the guide <ArrowUpRight className="ml-2" size={17} /></LinkButton></div></Container></Section>
  </>;
}
