"use client";
import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};
const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const TimezoneContext = createContext<{ online: boolean; selected: string; setSelected: (zone: string) => void } | null>(null);

export function ClassTimezoneProvider({ online, children }: { online: boolean; children: ReactNode }) {
  const [selected, setSelected] = useState("");
  return <TimezoneContext.Provider value={{ online, selected, setSelected }}>{children}</TimezoneContext.Provider>;
}

export function TimezoneSelector({ timezone }: { timezone: string }) {
  const context = useContext(TimezoneContext);
  const detected = useSyncExternalStore(subscribe, browserTimezone, () => timezone);
  const id = useId();
  if (!context?.online) return null;
  const zones = [...new Set([timezone, detected, "UTC", ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Australia/Sydney", "Australia/Perth", "Australia/Adelaide", "Australia/Brisbane", "Pacific/Auckland"])])];
  return <span className="mt-3 block max-w-sm"><label htmlFor={id} className="mb-2 block">Display timezone</label><select id={id} value={context.selected || detected} onChange={event => context.setSelected(event.target.value)}>{zones.map(zone => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}</select></span>;
}

export function VisitorTime({ startAt, endAt, timezone, allowConversion = false, showSelector = false }: { startAt: string; endAt?: string; timezone: string; allowConversion?: boolean; showSelector?: boolean }) {
  const context = useContext(TimezoneContext);
  const detected = useSyncExternalStore(subscribe, browserTimezone, () => timezone);
  const online = context?.online ?? allowConversion;
  const localZone = online ? context?.selected || detected : timezone;
  const format = (value: string, zone: string) => new Intl.DateTimeFormat("en-AU", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <span className="block"><time dateTime={startAt}>{format(startAt, localZone)}</time>{endAt && <span className="block">to <time dateTime={endAt}>{format(endAt, localZone)}</time></span>}<span className="mt-1 block text-xs font-normal text-[var(--muted)]">{online ? "Timezone" : "Venue timezone"}: {localZone}</span>{localZone !== timezone && <span className="mt-1 block text-xs font-normal text-[var(--muted)]">Class time: {format(startAt, timezone)} · {timezone}</span>}{online && showSelector && <TimezoneSelector timezone={timezone} />}</span>;
}
