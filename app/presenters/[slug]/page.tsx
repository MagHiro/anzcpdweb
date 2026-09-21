import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "@/components/icon";
import { ClassCard, Container, LinkButton, Section } from "@/components/ui";
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
    <section className="bg-[var(--forest)] text-white"><Container className="py-20 sm:py-24"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#8caf9f] bg-[#2d5e53] text-4xl font-black tracking-[-.08em] text-white sm:h-44 sm:w-44 sm:text-5xl">{presenter.initials}</div><div><p className="eyebrow text-[#a9cfc0]">Presenter profile <span className="mx-1 text-[#e87954]">/</span> {presenter.location}</p><h1 className="display mt-5 text-5xl leading-[.95] text-white sm:text-7xl">{presenter.name}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#c5d8ce]">{presenter.role}</p><p className="mt-6 max-w-2xl text-base leading-7 text-[#dce8e1]">{presenter.bio}</p></div></div></Container></section>
    <Section><Container><div className="grid gap-12 lg:grid-cols-[.62fr_1.38fr]"><aside><p className="eyebrow text-[var(--fern)]">Areas of focus</p><div className="mt-5 flex flex-wrap gap-2 lg:grid">{presenter.expertise.map((item) => <span key={item} className="rounded-full bg-[var(--mist)] px-4 py-2 text-xs font-bold text-[var(--forest)] lg:rounded-xl">{item}</span>)}</div><LinkButton href="/courses" variant="secondary" className="mt-8">Browse all activities <ArrowRight className="ml-2" size={16} /></LinkButton></aside><div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[var(--fern)]">Led by {presenter.name}</p><h2 className="display mt-3 text-4xl text-[var(--forest)]">Current activities</h2></div><Link href="/presenters" className="focus-ring text-sm font-bold text-[var(--forest)] underline decoration-[#e87954] underline-offset-4">All presenters</Link></div>{classes.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{classes.map((item) => <ClassCard key={item.id} item={item} />)}</div> : <div className="mt-8 rounded-[1.25rem] border border-dashed border-[var(--line)] p-8 text-sm leading-6 text-[var(--muted)]">No upcoming published classes are assigned to this presenter.</div>}</div></div></Container></Section>
  </>;
}
