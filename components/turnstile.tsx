"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string; reset: (widgetId: string) => void };
  }
}

export function Turnstile({ siteKey, onToken }: { siteKey?: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey || !container.current) return;
    const render = () => { if (window.turnstile && container.current) window.turnstile.render(container.current, { sitekey: siteKey, callback: onToken, "expired-callback": () => onToken(""), "error-callback": () => onToken("") }); };
    if (window.turnstile) render();
    else { const existing = document.querySelector<HTMLScriptElement>('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'); const script = existing ?? document.createElement("script"); if (!existing) { script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; script.async = true; script.defer = true; document.head.appendChild(script); } script.addEventListener("load", render); return () => script.removeEventListener("load", render); }
  }, [onToken, siteKey]);
  if (!siteKey) return <p className="text-xs text-[var(--muted)]">Security check is configured when the application is connected to Cloudflare Turnstile.</p>;
  return <div ref={container} aria-label="Security check" />;
}
