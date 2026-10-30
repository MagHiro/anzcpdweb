"use client";
import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";

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
  if (!ignoreClassContext && context && !context.online) return null;
  const zones = [...new Set([timezone, selected, "UTC", ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Australia/Sydney", "Australia/Melbourne", "Australia/Perth", "Australia/Adelaide", "Australia/Brisbane", "Pacific/Auckland"])])].sort();
  const matches = zones.filter(zone => zone === selected || zone.replaceAll("_", " ").toLowerCase().includes(search.trim().toLowerCase()));
  return <span className="mt-3 block max-w-sm text-sm"><label htmlFor={id} className="mb-2 block">{label}</label><label htmlFor={`${id}-search`} className="sr-only">Search cities and timezones</label><input id={`${id}-search`} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search city or timezone" className="focus-ring mb-2 w-full min-w-0" aria-controls={id} /><select className="focus-ring w-full min-w-0" id={id} value={saved && saved === selected ? selected : ""} onChange={event => setTimezone(event.target.value)}><option value="">Automatic ({detected.replaceAll("_", " ")})</option>{matches.map(zone => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}</select></span>;
}

export function VisitorTime({ startAt, endAt, timezone, allowConversion = false, showSelector = false }: { startAt: string; endAt?: string; timezone: string; allowConversion?: boolean; showSelector?: boolean }) {
  const context = useContext(TimezoneContext);
  const selected = useSyncExternalStore(subscribe, displayTimezone, () => timezone);
  const online = context?.online ?? allowConversion;
  const localZone = online ? selected : timezone;
  const format = (value: string, zone: string) => new Intl.DateTimeFormat("en-AU", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <span className="block"><time dateTime={startAt}>{format(startAt, localZone)}</time>{endAt && <span className="block">to <time dateTime={endAt}>{format(endAt, localZone)}</time></span>}<span className="mt-1 block text-xs font-normal text-[var(--muted)]">{online ? "Timezone" : "Venue timezone"}: {localZone}</span>{online && showSelector && <TimezoneSelector timezone={timezone} />}</span>;
}
