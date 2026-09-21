import Link from "next/link";
import { Container, Section } from "@/components/ui";

export default function NotFound() { return <Section><Container className="max-w-2xl text-center"><p className="eyebrow text-[var(--fern)]">404</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">That page is not here.</h1><p className="mt-4 text-base leading-7 text-[var(--muted)]">The class or record may have moved, been archived, or never been published.</p><Link href="/classes" className="mt-8 inline-block font-bold text-[var(--forest)] underline underline-offset-4">Return to classes</Link></Container></Section>; }
