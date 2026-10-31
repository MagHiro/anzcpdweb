"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { TimezoneSelector, browserTimezone, useVisitorTimezone } from "@/components/visitor-time";

const sessionKey = "anzcpd-preferences-shown";
const countryKey = "anzcpd-visitor-country";

function detectedCountry() {
  const zone = browserTimezone();
  if (zone.startsWith("Australia/")) return "AU";
  if (["Pacific/Auckland", "Pacific/Chatham"].includes(zone)) return "NZ";
  return "OTHER";
}

export function VisitorPreferences() {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("OTHER");
  const timezone = useVisitorTimezone();
  const panelId = useId();
  const countryId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanupAudio: (() => void) | undefined;
    const timer = window.setTimeout(() => {
    let shown = false;
    try {
      const stored = localStorage.getItem(countryKey);
      setCountry(stored === "AU" || stored === "NZ" || stored === "OTHER" ? stored : detectedCountry());
      shown = sessionStorage.getItem(sessionKey) === "true";
      sessionStorage.setItem(sessionKey, "true");
    } catch { setCountry(detectedCountry()); }
    if (shown) return;
    setOpen(true);

    // Browsers may suspend audio until a trusted user interaction.
    let audio: AudioContext | undefined;
    let played = false;
    const play = () => {
      if (played || !audio || audio.state !== "running") return;
      played = true;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.frequency.setValueAtTime(660, audio.currentTime);
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.3);
    };
    const resume = () => { if (audio && !played) void audio.resume().then(play).catch(() => {}); };
    try {
      audio = new AudioContext();
      play();
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
    } catch { /* Audio is optional when unsupported. */ }
    cleanupAudio = () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      if (audio) void audio.close().catch(() => {});
    };
    }, 500);
    return () => { window.clearTimeout(timer); cleanupAudio?.(); };
  }, []);

  const close = () => { setOpen(false); button.current?.focus(); };

  return <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6">
    {open && <div ref={panel} id={panelId} role="region" aria-label="Country and timezone" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }} className="visitor-preferences-panel max-w-full max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain bg-white text-[var(--forest)]">
      <div className="flex items-center justify-between gap-4"><h2>Country & timezone</h2><button type="button" onClick={close} aria-label="Close country and timezone" className="preferences-close focus-ring"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
      <p className="mt-2 text-sm text-[var(--muted)]">Online class times use your timezone. Change it anytime.</p>
      <label htmlFor={countryId} className="mt-4 mb-2 block text-sm">Country</label>
      <select id={countryId} value={country} className="focus-ring w-full min-w-0" onChange={event => { setCountry(event.target.value); try { localStorage.setItem(countryKey, event.target.value); } catch { /* Retain in memory. */ } }}>
        <option value="AU">Australia</option><option value="NZ">New Zealand</option><option value="OTHER">Other country</option>
      </select>
      <TimezoneSelector timezone="Australia/Sydney" label="Your timezone" ignoreClassContext />
      <Link href={country === "OTHER" ? "/classes" : `/classes?country=${country}`} className="focus-ring mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--forest)] px-6 py-3 text-sm font-semibold text-white" onClick={() => setOpen(false)}>Browse activities</Link>
    </div>}
    <button ref={button} type="button" aria-expanded={open} aria-controls={panelId} aria-label="Choose country and timezone" onClick={() => { setOpen(!open); if (!open) requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>("button")?.focus()); }} className="focus-ring flex max-w-full items-center gap-2 rounded-full bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white shadow-lg">
      <svg aria-hidden="true" className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 7h14M5 17h14" /></svg>
      <span className="truncate">{timezone.replaceAll("_", " ")}</span>
    </button>
  </div>;
}
