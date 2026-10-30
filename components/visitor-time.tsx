"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function VisitorTime({ startAt, endAt, timezone }: { startAt: string; endAt?: string; timezone: string }) {
  const localZone = useSyncExternalStore(subscribe, browserTimezone, () => timezone);
  const format = (value: string, zone: string) => new Intl.DateTimeFormat("en-AU", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <span className="block"><time dateTime={startAt}>{format(startAt, localZone)}</time>{endAt && <span className="block">to <time dateTime={endAt}>{format(endAt, localZone)}</time></span>}<span className="mt-1 block text-xs font-normal text-[var(--muted)]">{localZone === timezone ? "Class timezone" : "Your timezone"}: {localZone}</span>{localZone !== timezone && <span className="mt-1 block text-xs font-normal text-[var(--muted)]">Class time: {format(startAt, timezone)} · {timezone}</span>}</span>;
}
