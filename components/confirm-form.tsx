"use client";
import { useRef, useState, type ComponentProps } from "react";
import { AdminModal } from "@/components/admin-modal";
import { Button } from "@/components/ui";

/** Preserve the original submitter and React form action after an explicit review. */
export function ConfirmForm({ message, children, ...props }: Omit<ComponentProps<"form">, "onSubmit"> & { message?: string | ((data: FormData) => string) }) {
  const form = useRef<HTMLFormElement>(null);
  const approved = useRef(false);
  const submitter = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  const [review, setReview] = useState<string | null>(null);
  return <><form {...props} ref={form} onSubmit={event => {
    if (!message || approved.current) { approved.current = false; return; }
    event.preventDefault();
    submitter.current = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;
    setReview(typeof message === "function" ? message(new FormData(event.currentTarget)) : message);
  }}>{children}</form><AdminModal open={review !== null} onClose={() => setReview(null)} title="Review this action" size="medium"><p className="text-sm leading-7 text-[var(--muted)]">{review}</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setReview(null)}>Keep unchanged</Button><Button type="button" variant="danger" onClick={() => { approved.current = true; setReview(null); form.current?.requestSubmit(submitter.current ?? undefined); }}>Confirm action</Button></div></AdminModal></>;
}
