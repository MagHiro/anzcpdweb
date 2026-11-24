"use client";

import { useId, useRef, useState } from "react";
import { CloseIcon } from "@/components/icon";
import { TimezoneSelector, useVisitorTimezone } from "@/components/visitor-time";

export function VisitorPreferences() {
  const [open, setOpen] = useState(false);
  const timezone = useVisitorTimezone();
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const close = () => { setOpen(false); button.current?.focus(); };

  return <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6">
    <div id={panelId} role="region" aria-labelledby={`${panelId}-title`} data-open={open} inert={!open} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }} className="visitor-preferences-panel max-w-full max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain">
      <div className="visitor-preferences-heading">
        <h2 id={`${panelId}-title`}>Time zone</h2>
        <button ref={closeButton} type="button" onClick={close} aria-label="Close time zone settings" className="preferences-close focus-ring"><CloseIcon size={18} /></button>
      </div>
      <div className="visitor-preferences-field">
        <TimezoneSelector timezone="Australia/Sydney" label="Time zone for online classes" ignoreClassContext />
      </div>
    </div>
    <button ref={button} type="button" aria-expanded={open} aria-controls={panelId} aria-label="Choose timezone" onClick={() => { if (open) close(); else { setOpen(true); requestAnimationFrame(() => closeButton.current?.focus()); } }} className="visitor-preferences-trigger focus-ring">
      <svg aria-hidden="true" className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 7h14M5 17h14" /></svg>
      <span className="truncate">{timezone.replaceAll("_", " ")}</span>
    </button>
  </div>;
}
