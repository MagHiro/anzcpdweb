"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "@/components/icon";

export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  size = "wide",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "medium" | "wide";
}) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(23,60,55,.42)] p-4 sm:p-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" className={`my-auto flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[#fbfaf6] shadow-[0_24px_90px_rgba(23,60,55,.28)] sm:max-h-[calc(100vh-4rem)] ${size === "medium" ? "max-w-2xl" : "max-w-5xl"}`}>
      <header className="flex shrink-0 items-start justify-between gap-6 border-b border-[var(--line)] bg-white px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow text-[var(--fern)]">Admin editor</p>
          <h2 id="admin-modal-title" className="display mt-2 text-3xl text-[var(--forest)]">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
        <button type="button" aria-label="Close editor" className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--forest)] hover:bg-[var(--mist)]" onClick={onClose}><CloseIcon /></button>
      </header>
      <div className="min-h-0 overflow-y-auto p-4 sm:p-7">{children}</div>
    </section>
  </div>;
}
