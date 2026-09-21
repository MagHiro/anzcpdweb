import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { Reveal } from "@/components/animations";
import { Container, EmptyState, Section } from "@/components/ui";
import { getPresenters } from "@/server/catalogue/queries";

export const metadata: Metadata = { title: "Presenters", description: "Meet the migration professionals and facilitators behind ANZ Migration Academy CPD activities." };
export const dynamic = "force-dynamic";

export default async function PresentersPage() {
  let unavailable = false;
  let profiles: Awaited<ReturnType<typeof getPresenters>> = [];
  try { profiles = await getPresenters(); } catch { profiles = []; unavailable = true; }
  return <>
    <section className="bg-[var(--mist)]"><Container className="py-12 sm:py-16"><p className="eyebrow text-[var(--fern)]">The people behind the sessions</p><h1 className="display mt-5 max-w-4xl text-5xl leading-[.95] text-[var(--forest)] sm:text-7xl">Learn from people who do the work.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">Our presenters bring source-led, practice-focused conversations to each activity. Read their profiles, then browse the sessions they lead.</p></Container></section>
    <Section className="bg-[var(--paper)]"><Container>{profiles.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{profiles.map((presenter) => <Reveal key={presenter.slug}><article className="card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-none"><div className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--mist)] p-6"><div className="relative flex items-start justify-between"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#a9cfc0] bg-[#2d5e53] text-lg font-black tracking-[-.05em] text-white">{presenter.initials}</span><span className="eyebrow pt-2 text-[var(--fern)]">Presenter</span></div></div><div className="flex flex-1 flex-col p-6"><h2 className="display text-3xl text-[var(--forest)]">{presenter.name}</h2><p className="mt-2 text-sm font-semibold text-[var(--signal)]">{presenter.role}</p><p className="mt-5 text-sm leading-6 text-[var(--muted)]">{presenter.bio}</p><div className="mt-6 flex flex-wrap gap-2">{presenter.expertise.map((item) => <span key={item} className="rounded-full bg-[var(--mist)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--forest)]">{item}</span>)}</div><Link href={`/presenters/${presenter.slug}`} className="focus-ring mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[var(--forest)] underline decoration-[var(--signal)] underline-offset-4">View profile <ArrowUpRight size={16} /></Link></div></article></Reveal>)}</div> : <EmptyState title={unavailable ? "We couldn’t load this information." : "No presenters are available yet."} description={unavailable ? "Please try again shortly, or contact the academy for help." : "Meet the academy’s presenters here as profiles become available."} />}</Container></Section>
    <section className="border-y border-[#eadfd2] bg-[var(--signal-soft)]"><Container className="flex flex-wrap items-center justify-between gap-6 py-8"><p className="max-w-xl text-sm leading-6 text-[#6f5b4e]">Interested in presenting or arranging a private study programme for your team?</p><a href="mailto:info@anzmigrationacademy.com" className="focus-ring rounded-full border border-[var(--signal)] px-5 py-3 text-sm font-bold text-[#85551e] hover:bg-[#f4d8cb]">Contact the academy</a></Container></section>
  </>;
}
