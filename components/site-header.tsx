"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CloseIcon, Mail, MenuIcon } from "@/components/icon";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/classes", label: "Activities" },
  { href: "/australia", label: "Australia" },
  { href: "/new-zealand", label: "New Zealand" },
  { href: "/cpd-requirements", label: "CPD guide" },
  { href: "/presenters", label: "Presenters" },
  { href: "/complaints", label: "Complaints" },
];

function AcademyMark() {
  return <span className="academy-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" width="35" height="35"><path d="M9 34V14h8l7 12 7-12h8v20h-7V24l-8 12-8-12v10H9Z" fill="currentColor" /><path d="M10 8h28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg></span>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
      if (e.key !== "Tab") return;
      const targets = [buttonRef.current, ...Array.from(document.querySelectorAll<HTMLElement>("#site-navigation a"))].filter((el): el is HTMLElement => Boolean(el));
      if (!targets.length) return;
      if (e.shiftKey && document.activeElement === targets[0]) { e.preventDefault(); targets[targets.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === targets[targets.length - 1]) { e.preventDefault(); targets[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);
  return <header className="site-header sticky top-0 z-40">
    <div className="mx-auto flex min-h-[88px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
      <Link href="/" className="brand-lockup focus-ring" onClick={() => setOpen(false)} aria-label="ANZ Migration Academy home">
        <AcademyMark /><span><strong>ANZ Migration</strong><small>Academy / CPD</small></span>
      </Link>
      <button ref={buttonRef} type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-navigation" className="mobile-menu-trigger focus-ring md:hidden" onClick={() => setOpen(v => !v)}>{open ? <CloseIcon /> : <MenuIcon />}</button>
      <nav id="site-navigation" aria-label="Main navigation" className={cn("site-navigation", open && "is-open")}>
        {navigation.map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} onClick={() => setOpen(false)} className={cn("site-nav-link focus-ring", active(item.href) && "is-active")}>{item.label}</Link>)}
        <Link href="/sign-in" onClick={() => setOpen(false)} className="site-signin focus-ring">My account <ArrowUpRight size={17} /></Link>
      </nav>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-cta"><div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20"><div className="flex flex-wrap items-end justify-between gap-8"><h2 className="display max-w-2xl text-4xl sm:text-6xl">Ready for what’s next?</h2><Link href="/classes" className="footer-cta-button focus-ring">Find your next activity <ArrowUpRight size={19} /></Link></div></div></div>
    <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr_1fr] lg:px-12">
      <div><Link href="/" className="brand-lockup brand-inverse focus-ring"><AcademyMark /><span><strong>ANZ Migration</strong><small>Academy / CPD</small></span></Link><p className="mt-6 max-w-sm text-sm leading-7 text-[#b6cbc2]">Thoughtful professional development for migration agents and immigration advisers across Australia and New Zealand.</p><a className="mt-6 inline-flex items-center gap-2 text-sm text-white hover:opacity-80" href="mailto:info@anzmigrationacademy.com"><Mail size={16} /> info@anzmigrationacademy.com</a></div>
      <div><h3 className="footer-group-title">Explore</h3><div className="mt-5 grid gap-3 text-sm"><Link href="/classes">CPD activities</Link><Link href="/australia">Australia</Link><Link href="/new-zealand">New Zealand</Link><Link href="/cpd-requirements">CPD guide</Link><Link href="/presenters">Presenters</Link></div></div>
      <div><h3 className="footer-group-title">Support & policies</h3><div className="mt-5 grid gap-3 text-sm"><Link href="/complaints">Complaints & resolution</Link><Link href="/complaints/procedure">Complaints procedure</Link><Link href="/refund-policy">Refunds and cancellations</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/sign-in">Learner account</Link></div></div>
    </div>
    <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-3 px-5 pb-8 text-xs leading-6 text-[#9eb8ab] sm:px-8 lg:px-12"><p>© {new Date().getFullYear()} AU &amp; NZ Migration Academy Pty Ltd · Trading as ANZ Migration Academy</p><p>Learning information should be checked against current professional requirements.</p></div>
  </footer>;
}
