"use client";

import { useEffect } from "react";
import { Container, Section, LinkButton } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error("[app:error]", { digest: error.digest }); }, [error]); return <Section><Container className="max-w-2xl text-center"><p className="eyebrow text-[var(--error)]">Something needs another try</p><h1 className="display mt-4 text-5xl text-[var(--forest)]">We couldn’t complete that request.</h1><p className="mt-4 text-base leading-7 text-[var(--muted)]">Your payment or booking state is not changed by this page error unless a confirmation says otherwise.</p><div className="mt-8 flex justify-center gap-3"><button onClick={reset} className="focus-ring inline-flex min-h-11 items-center rounded-full bg-[var(--forest)] px-5 text-sm font-bold text-white">Try again</button><LinkButton href="/">Go home</LinkButton></div></Container></Section>; }
