"use client";
import { createContext, useContext, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const storageKey = "anzcpd-display-timezone";
const changeEvent = "anzcpd-timezone-change";
let selectedTimezone = "";
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changeEvent, listener);
  };
};
export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const displayTimezone = () => {
  let zone = selectedTimezone;
  try { zone = window.localStorage.getItem(storageKey) || zone; } catch { /* Storage may be disabled. */ }
  try {
    if (zone) { new Intl.DateTimeFormat("en-AU", { timeZone: zone }); return zone; }
  } catch { /* Ignore invalid stored preferences. */ }
  return browserTimezone();
};
const setTimezone = (zone: string) => {
  selectedTimezone = zone;
  try { window.localStorage.setItem(storageKey, zone); } catch { /* Keep the preference for this page. */ }
  window.dispatchEvent(new Event(changeEvent));
};
const TimezoneContext = createContext<{ online: boolean } | null>(null);

export function useVisitorTimezone() {
  return useSyncExternalStore(subscribe, displayTimezone, () => "Australia/Sydney");
}

const savedTimezone = () => {
  try { return window.localStorage.getItem(storageKey) || selectedTimezone; } catch { return selectedTimezone; }
};

export function ClassTimezoneProvider({ online, children }: { online: boolean; children: ReactNode }) {
  return <TimezoneContext.Provider value={{ online }}>{children}</TimezoneContext.Provider>;
}

export function TimezoneSelector({ timezone, label = "Display timezone", ignoreClassContext = false }: { timezone: string; label?: string; ignoreClassContext?: boolean }) {
  const context = useContext(TimezoneContext);
  const selected = useSyncExternalStore(subscribe, displayTimezone, () => timezone);
  const saved = useSyncExternalStore(subscribe, savedTimezone, () => "");
  const detected = useSyncExternalStore(subscribe, browserTimezone, () => timezone);
  const id = useId();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLSpanElement>(null);
  if (!ignoreClassContext && context && !context.online) return null;
  const zones = [...new Set([timezone, selected, "UTC", ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Australia/Sydney", "Australia/Melbourne", "Australia/Perth", "Australia/Adelaide", "Australia/Brisbane", "Pacific/Auckland"])])].sort();
  const value = saved && saved === selected ? selected : "";
  const automatic = `Automatic (${detected.replaceAll("_", " ")})`;
  const options = [{ value: "", label: automatic }, ...zones.map(zone => ({ value: zone, label: zone.replaceAll("_", " ") }))].filter(option => option.label.toLowerCase().includes(search.trim().replaceAll("_", " ").toLowerCase()));
  const current = value ? value.replaceAll("_", " ") : automatic;
  const close = () => { setOpen(false); setSearch(""); setActive(0); };
  const choose = (zone: string) => { setTimezone(zone); close(); };
  const show = () => {
    if (open) return;
    setActive(Math.max(0, options.findIndex(option => option.value === value)));
    setOpen(true);
  };
  return <span className="timezone-picker mt-3 block max-w-sm text-sm" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <label id={`${id}-label`} htmlFor={`${id}-input`} className="mb-2 block">{label}</label>
    <span className="timezone-picker-control">
      <input ref={input} id={`${id}-input`} type="text" role="combobox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} aria-autocomplete="list" aria-describedby={`${id}-selection`} aria-activedescendant={open && options[active] ? `${id}-option-${active}` : undefined} value={search} placeholder={current} autoComplete="off" spellCheck={false} onClick={show} onChange={event => { setSearch(event.target.value); setActive(0); setOpen(true); if (list.current) list.current.scrollTop = 0; }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) { show(); return; }
            if (!options.length) return;
            const next = Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)));
            setActive(next);
            document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" });
          }
          if (event.key === "Enter") { event.preventDefault(); if (!open) show(); else if (options[active]) choose(options[active].value); }
      }} />
      <span id={`${id}-selection`} className="sr-only">Current selection: {current}. Type to filter.</span>
      <button type="button" tabIndex={-1} aria-label={open ? "Hide time zones" : "Show time zones"} aria-expanded={open} onMouseDown={event => event.preventDefault()} onClick={() => { input.current?.focus(); if (open) close(); else show(); }}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 10 5 5 5-5" /></svg></button>
    </span>
    {open && <span className="timezone-picker-results">
        <span ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="block max-h-40 min-h-0 overflow-y-auto overscroll-contain p-1">
          {options.map((option, index) => <span key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={value === option.value} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(option.value)} className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-3 ${index === active ? "bg-[var(--mist)]" : ""}`}><span aria-hidden="true" className="w-4 shrink-0">{value === option.value ? "✓" : ""}</span>{option.label}</span>)}
        </span>
        {!options.length && <span role="status" className="block px-3 pb-3 text-[var(--muted)]">No matching time zones</span>}
    </span>}
  </span>;
}

export function VisitorTime({ startAt, endAt, timezone, allowConversion = false, showSelector = false, compact = false, inlineRange = false }: { startAt: string; endAt?: string; timezone: string; allowConversion?: boolean; showSelector?: boolean; compact?: boolean; inlineRange?: boolean }) {
  const context = useContext(TimezoneContext);
  const selected = useSyncExternalStore(subscribe, displayTimezone, () => timezone);
  const online = context?.online ?? allowConversion;
  const localZone = online ? selected : timezone;
  const format = (value: string, zone: string) => new Intl.DateTimeFormat("en-AU", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  if (compact) return <time dateTime={startAt} title={`Timezone: ${localZone}`}>{format(startAt, localZone)} ({localZone.split("/").pop()?.replaceAll("_", " ")})</time>;
  return <span className="block"><time dateTime={startAt}>{format(startAt, localZone)}</time>{endAt && (inlineRange ? <> <span className="whitespace-nowrap">to <time dateTime={endAt}>{format(endAt, localZone)}</time></span></> : <span className="block">to <time dateTime={endAt}>{format(endAt, localZone)}</time></span>)}<span className="mt-1 block text-xs font-normal text-[var(--muted)]">{online ? "Timezone" : "Venue timezone"}: {localZone}</span>{online && showSelector && <TimezoneSelector timezone={timezone} />}</span>;
}
