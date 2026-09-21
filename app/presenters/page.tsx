import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { Reveal } from "@/components/animations";
import { Container, Section } from "@/components/ui";
import { presenters as fallbackPresenters } from "@/lib/domain/cpd";
import { getPresenters } from "@/server/catalogue/queries";

export const metadata: Metadata = {
  title: "Presenters",
  description: "Meet the migration professionals and facilitators behind ANZ Migration Academy CPD activities.",
};

export const dynamic = "force-dynamic";

export default async function PresentersPage() {
  let profiles = fallbackPresenters;
  try { profiles = await getPresenters(); } catch { /* Keep the brochure profiles available when the database is not configured. */ }
  return <>
    <section className="bg-[var(--mist)]"><Container className="py-20 sm:py-24"><p className="eyebrow text-[var(--fern)]">The people behind the sessions</p><h1 className="display mt-5 max-w-4xl text-5xl leading-[.95] text-[var(--forest)] sm:text-7xl">Learn from people who do the work.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">Our presenters bring source-led, practice-focused conversations to each activity. Read their profiles, then browse the sessions they lead.</p></Container></section>
    <Section><Container><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{profiles.map((presenter) => <Reveal key={presenter.slug}><article className="group flex h-full flex-col rounded-[1.45rem] border border-[var(--line)] bg-white p-6 transition hover:-translate-y-1 hover:border-[#a9c7bd] hover:shadow-[0_18px_50px_rgba(23,60,55,.08)]"><div className="flex items-start justify-between gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--forest)] text-lg font-black tracking-[-.05em] text-white">{presenter.initials}</div><span className="eyebrow pt-2 text-[var(--fern)]">Presenter</span></div><h2 className="display mt-8 text-3xl text-[var(--forest)]">{presenter.name}</h2><p className="mt-2 text-sm font-semibold text-[#a7472b]">{presenter.role}</p><p className="mt-5 text-sm leading-6 text-[var(--muted)]">{presenter.bio}</p><div className="mt-6 flex flex-wrap gap-2">{presenter.expertise.map((item) => <span key={item} className="rounded-full bg-[var(--mist)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--forest)]">{item}</span>)}</div><Link href={`/presenters/${presenter.slug}`} className="focus-ring mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[var(--forest)] underline decoration-[#e87954] underline-offset-4">View profile <ArrowUpRight size={16} /></Link></article></Reveal>)}</div></Container></Section>
    <section className="border-y border-[#eadfd2] bg-[#fff8ef]"><Container className="flex flex-wrap items-center justify-between gap-6 py-8"><p className="max-w-xl text-sm leading-6 text-[#6f5b4e]">Interested in presenting or arranging a private study programme for your team?</p><a href="mailto:info@anzmigrationacademy.com" className="focus-ring rounded-full border border-[#b77b3f] px-5 py-3 text-sm font-bold text-[#85551e] hover:bg-[#fbead4]">Contact the academy</a></Container></section>
  </>;
}
