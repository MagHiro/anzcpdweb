import Link from "next/link";
import { ArrowUpRight } from "@/components/icon";
import { ClassCard, Container, EmptyState, LinkButton, Section, type ActivityCardItem } from "@/components/ui";

type Item = ActivityCardItem & { id: string };
type Props = { code: "AU" | "NZ"; label: string; headline: string; summary: string; themes: string[]; context: string; items: Item[]; unavailable: boolean };

export function CountryLanding({ code, label, headline, summary, themes, context, items, unavailable }: Props) {
  return <>
    <Section className="country-hero">
      <Container>
        <h1 className="max-w-5xl text-5xl leading-none sm:text-7xl">{headline}</h1>
        <p className="mt-8 max-w-2xl text-lg leading-7">{summary}</p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <LinkButton href={`/classes?country=${code}`} size="lg" className="!bg-white !text-[var(--forest)] hover:!bg-[var(--mist)]">Browse {label} activities <ArrowUpRight size={17} className="ml-3" /></LinkButton>
          <Link href={`/classes?country=${code}&time=past`} className="focus-ring py-3 text-sm underline underline-offset-4">Explore past classes</Link>
        </div>
      </Container>
    </Section>
    <Section><Container className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
      <h2 className="max-w-md text-4xl sm:text-5xl">Topics for the work you do.</h2>
      <div><div className="grid gap-4 sm:grid-cols-3">{themes.map(theme => <div key={theme} className="country-topics"><h3 className="text-2xl leading-tight">{theme}</h3></div>)}</div><p className="mt-6 text-base leading-7 text-[var(--muted)]">{context}</p></div>
    </Container></Section>
    <Section className="border-t border-[var(--line)]"><Container>
      <div className="flex flex-wrap items-end justify-between gap-6"><h2 className="text-4xl sm:text-5xl">Upcoming in {label}.</h2><Link href={`/classes?country=${code}`} className="ink-link">View all activities <ArrowUpRight size={18} /></Link></div>
      <div className="mt-12">{items.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <ClassCard key={item.id} item={item} />)}</div> : <EmptyState title={unavailable ? "Classes are temporarily unavailable." : "New dates are coming soon."} description={unavailable ? "Please try again shortly." : "There are no upcoming classes published for this country yet. You can still explore the wider programme."} action={<LinkButton href="/classes" variant="secondary">Browse all activities</LinkButton>} />}</div>
    </Container></Section>
  </>;
}
