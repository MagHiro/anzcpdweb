"use client";
import { createContext, useContext, useId, useRef, useState, useSyncExternalStore, type ReactNode, type CSSProperties } from "react";

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
  const [position, setPosition] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  if (!ignoreClassContext && context && !context.online) return null;
  const zones = [...new Set([timezone, selected, "UTC", ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Australia/Sydney", "Australia/Melbourne", "Australia/Perth", "Australia/Adelaide", "Australia/Brisbane", "Pacific/Auckland"])])].sort();
  const value = saved && saved === selected ? selected : "";
  const automatic = `Automatic (${detected.replaceAll("_", " ")})`;
  const options = [{ value: "", label: automatic }, ...zones.map(zone => ({ value: zone, label: zone.replaceAll("_", " ") }))].filter(option => option.label.toLowerCase().includes(search.trim().replaceAll("_", " ").toLowerCase()));
  const close = () => { dropdown.current?.hidePopover(); trigger.current?.focus(); };
  const choose = (zone: string) => { setTimezone(zone); close(); };
  const show = () => {
    if (open) { close(); return; }
    const rect = trigger.current!.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    const upward = below < 300 && above > below;
    setPosition({ position: "fixed", margin: 0, left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), width: rect.width, ...(upward ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }), maxHeight: Math.max(100, Math.min(340, (upward ? above : below) - 12)) });
    setSearch("");
    setActive(0);
    dropdown.current?.showPopover();
    requestAnimationFrame(() => input.current?.focus());
  };
  return <span className="mt-3 block max-w-sm text-sm">
    <span id={`${id}-label`} className="mb-2 block">{label}</span>
    <button ref={trigger} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} onClick={show} className="focus-ring flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-3 text-left"><span id={`${id}-value`} className="truncate">{value ? value.replaceAll("_", " ") : automatic}</span><span aria-hidden="true">⌄</span></button>
    <span ref={dropdown} popover="auto" onToggle={event => setOpen(event.newState === "open")} style={position} className="overflow-hidden rounded-lg border border-[var(--line)] bg-white text-[var(--forest)] shadow-lg" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }}>
      <span className="flex max-h-[inherit] flex-col">
        <span className="block shrink-0 border-b border-[var(--line)] p-2"><input ref={input} type="search" role="combobox" aria-label={`Search ${label.toLowerCase()}`} aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={options[active] ? `${id}-option-${active}` : undefined} value={search} onChange={event => { setSearch(event.target.value); setActive(0); }} onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)));
            setActive(next);
            document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" });
          }
          if (event.key === "Enter") { event.preventDefault(); if (options[active]) choose(options[active].value); }
          if (event.key === "Tab") dropdown.current?.hidePopover();
        }} placeholder="Search city or timezone" className="focus-ring w-full min-w-0" /></span>
        <span id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="block min-h-0 overflow-y-auto overscroll-contain p-1">
          {options.map((option, index) => <span key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={value === option.value} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(option.value)} className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-3 ${index === active ? "bg-[var(--mist)]" : ""}`}><span aria-hidden="true" className="w-4 shrink-0">{value === option.value ? "✓" : ""}</span>{option.label}</span>)}
          {!options.length && <span role="status" className="block px-3 py-4 text-[var(--muted)]">No matching timezones</span>}
        </span>
      </span>
    </span>
  </span>;
}

export function VisitorTime({ startAt, endAt, timezone, allowConversion = false, showSelector = false }: { startAt: string; endAt?: string; timezone: string; allowConversion?: boolean; showSelector?: boolean }) {
  const context = useContext(TimezoneContext);
  const selected = useSyncExternalStore(subscribe, displayTimezone, () => timezone);
  const online = context?.online ?? allowConversion;
  const localZone = online ? selected : timezone;
  const format = (value: string, zone: string) => new Intl.DateTimeFormat("en-AU", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <span className="block"><time dateTime={startAt}>{format(startAt, localZone)}</time>{endAt && <span className="block">to <time dateTime={endAt}>{format(endAt, localZone)}</time></span>}<span className="mt-1 block text-xs font-normal text-[var(--muted)]">{online ? "Timezone" : "Venue timezone"}: {localZone}</span>{online && showSelector && <TimezoneSelector timezone={timezone} />}</span>;
}
