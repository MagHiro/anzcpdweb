"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icon";
export function AdminModal({ open, onClose, title, description, children, size = "wide" }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: "medium" | "wide" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={id} aria-describedby={description ? `${id}-description` : undefined} onCancel={event => { event.preventDefault(); onClose(); }} className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-[var(--line)] bg-white p-0 shadow-xl ${size === "medium" ? "max-w-2xl" : "max-w-5xl"}`}>
    {open && <><header className="flex items-start justify-between gap-5 border-b border-[var(--line)] px-6 py-5"><div><h2 id={id} className="text-2xl font-semibold">{title}</h2>{description && <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>}</div><button type="button" aria-label="Close dialog" onClick={onClose} className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--line)]"><CloseIcon /></button></header><div className="max-h-[70dvh] overflow-y-auto p-6">{children}</div></>}
  </dialog>;
}
