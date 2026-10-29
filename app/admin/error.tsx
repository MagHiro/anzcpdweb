"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="mx-auto max-w-xl py-16"><h1 className="display text-3xl text-[var(--forest)]">This view couldn’t load</h1><p className="mt-4 text-sm leading-7 text-[var(--muted)]">Your work may already have been saved. Reload to get the latest version before retrying an action. Check the payment record before submitting another refund.</p>{error.digest && <p className="mt-4 font-mono text-xs text-[var(--muted)]">Reference: {error.digest}</p>}<div className="mt-7 flex flex-wrap gap-3"><Button onClick={reset}>Try again</Button><Button variant="secondary" onClick={() => window.location.reload()}>Reload page</Button></div></section>;
}
