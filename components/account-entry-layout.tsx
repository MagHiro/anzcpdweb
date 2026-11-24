import type { ReactNode } from "react";
import { Container, Section } from "@/components/ui";

function AccountArtwork() {
  return <div className="signin-artwork" aria-hidden="true">
    <svg viewBox="0 0 480 500" fill="none" focusable="false">
      <g stroke="#a1cbb9" opacity=".4">
        <circle cx="240" cy="250" r="166" />
        <circle cx="240" cy="250" r="200" />
        <path d="M40 250h400M240 50v400" strokeDasharray="3 8" />
      </g>
      <circle cx="74" cy="250" r="4" fill="#a1cbb9" />
      <circle cx="354" cy="86" r="5" fill="#e2f3e9" />
      <rect x="144" y="121" width="192" height="256" rx="16" fill="#558472" stroke="#a1cbb9" transform="rotate(13 240 250)" />
      <g transform="rotate(-11 240 250)">
        <rect x="134" y="111" width="192" height="256" rx="16" fill="#f0f8f3" />
        <path d="M153 173h154" stroke="#b5d2c3" />
        <path d="M157 151v-21h5l7 12 7-12h5v21h-5v-12l-7 12-7-12v12z" fill="#14382c" />
        <path d="M157 203h142M157 224h113M157 245h130" stroke="#558472" strokeWidth="2" strokeLinecap="round" />
        <path d="M157 316h68m-68 14h48" stroke="#558472" strokeWidth="2" strokeLinecap="round" />
        <circle cx="281" cy="318" r="23" fill="#c2e3d2" />
        <path d="m271 318 7 7 13-14" stroke="#14382c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  </div>;
}

export function AccountEntryLayout({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <Section className="signin-page"><Container>
    <div className="signin-layout">
      <AccountArtwork />
      <div className="signin-panel">
        <h1>{title}</h1>
        {description && <p className="signin-intro">{description}</p>}
        {children}
      </div>
    </div>
  </Container></Section>;
}
