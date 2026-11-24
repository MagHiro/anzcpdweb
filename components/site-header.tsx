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
  const [session, setSession] = useState<{ pathname: string; signedIn: boolean } | null>(null);
  const signedIn = session?.pathname === pathname && session.signedIn;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  useEffect(() => {
    let request: AbortController | undefined;
    const checkSession = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const response = await fetch("/api/auth/get-session", { cache: "no-store", signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setSession({ pathname, signedIn: Boolean(data?.user?.id && data?.session) });
      } catch {
        if (!controller.signal.aborted) setSession({ pathname, signedIn: false });
      }
    };
    void checkSession();
    window.addEventListener("focus", checkSession);
    return () => {
      request?.abort();
      window.removeEventListener("focus", checkSession);
    };
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(width > 900px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
      if (e.key !== "Tab") return;
      const targets = [buttonRef.current, ...Array.from(navRef.current?.querySelectorAll("a") ?? [])].filter((el): el is HTMLButtonElement | HTMLAnchorElement => Boolean(el));
      if (!targets.length) return;
      if (e.shiftKey && document.activeElement === targets[0]) { e.preventDefault(); targets[targets.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === targets[targets.length - 1]) { e.preventDefault(); targets[0].focus(); }
    };
    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      desktop.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return <header className="site-header sticky top-0 z-40">
    <div className="site-header-inner mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
      <Link href="/" className="brand-lockup focus-ring" onClick={() => setOpen(false)} aria-label="ANZ Migration Academy home">
        <AcademyMark /><strong>ANZ Migration Academy</strong>
      </Link>
      <button ref={buttonRef} type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-navigation" className="mobile-menu-trigger focus-ring" onClick={() => setOpen(v => !v)}>{open ? <CloseIcon /> : <MenuIcon />}</button>
      <nav ref={navRef} id="site-navigation" aria-label="Main navigation" className={cn("site-navigation", open && "is-open")}>
        <ul className="site-nav-rail">
          {navigation.map(item => <li key={item.href}><Link href={item.href} aria-current={active(item.href) ? "page" : undefined} onClick={() => setOpen(false)} className="site-nav-link focus-ring">{item.label}</Link></li>)}
        </ul>
        <Link href={signedIn ? "/account" : "/sign-in"} aria-current={active(signedIn ? "/account" : "/sign-in") ? "page" : undefined} onClick={() => setOpen(false)} className="site-signin focus-ring">{signedIn ? "My account" : "Sign in"} <span className="site-signin-arrow"><ArrowUpRight size={16} /></span></Link>
      </nav>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
      <div className="site-footer-main">
        <div className="site-footer-identity">
          <Link href="/" className="brand-lockup focus-ring" aria-label="ANZ Migration Academy home"><AcademyMark /><strong>ANZ Migration Academy</strong></Link>
          <a className="site-footer-email focus-ring" href="mailto:info@anzmigrationacademy.com"><Mail size={16} /> <span>info@anzmigrationacademy.com</span></a>
        </div>
        <nav aria-label="Footer navigation" className="site-footer-navigation">
          <div><h2>Classes</h2><ul><li><Link href="/classes">All classes</Link></li><li><Link href="/australia">Australia</Link></li><li><Link href="/new-zealand">New Zealand</Link></li><li><Link href="/cpd-requirements">CPD guide</Link></li><li><Link href="/presenters">Presenters</Link></li></ul></div>
          <div><h2>Support</h2><ul><li><Link href="/account">My account</Link></li><li><Link href="/contact">Contact us</Link></li><li><Link href="/complaints">Complaints &amp; resolution</Link></li><li><Link href="/complaints/procedure">Complaints procedure</Link></li></ul></div>
          <div><h2>Policies</h2><ul><li><Link href="/refund-policy">Refunds and cancellations</Link></li><li><Link href="/privacy">Privacy</Link></li><li><Link href="/terms">Terms</Link></li></ul></div>
        </nav>
      </div>
      <div className="site-footer-legal"><p>© {new Date().getFullYear()} AU &amp; NZ Migration Academy Pty Ltd · Trading as ANZ Migration Academy · ABN: 19700088526</p><p>Check the current CPD requirements for your profession.</p></div>
    </div>
  </footer>;
}
