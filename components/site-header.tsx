"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CloseIcon, Mail, MenuIcon, Phone } from "@/components/icon";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/classes", label: "CPD activities" },
  { href: "/cpd-requirements", label: "CPD guide" },
  { href: "/presenters", label: "Presenters" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const links = Array.from(document.querySelectorAll<HTMLElement>('#site-navigation a[href]'));
        const first = menuButtonRef.current;
        const last = links.at(-1);
        if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
      }
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  return <header className="site-header sticky top-0 z-40 border-b border-[var(--line)]/80 bg-[var(--surface)]/95 backdrop-blur-xl">
    <div className="hidden border-b border-[var(--forest)]/20 bg-[var(--forest)] text-[#d9e8df] sm:block">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-2 text-[10px] font-bold uppercase tracking-[.12em] sm:px-8 lg:px-12">
        <p>Migration Academy <span className="mx-2 text-[var(--signal)]">•</span> CPD for migration professionals</p>
        <div className="flex items-center gap-5 normal-case tracking-normal text-[#c6d9d0]"><a className="inline-flex items-center gap-1.5 hover:text-white" href="tel:+61283808833"><Phone size={12} /> +61 2 8380 8833</a><a className="inline-flex items-center gap-1.5 hover:text-white" href="mailto:info@anzmigrationacademy.com"><Mail size={12} /> info@anzmigrationacademy.com</a></div>
      </div>
    </div>
    <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
      <Link href="/" className="focus-ring group flex items-center gap-3" onClick={closeMenu}>
        <span className="leading-none"><span className="block text-[14px] font-extrabold tracking-[.1em] text-[var(--forest)]">MIGRATION ACADEMY</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.24em] text-[var(--muted)]">CPD · AU / NZ</span></span>
      </Link>
      <button ref={menuButtonRef} type="button" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? "Close menu" : "Open menu"} className="focus-ring flex h-10 w-10 items-center justify-center rounded-[.55rem] border border-[var(--line)] text-[var(--forest)] md:hidden" onClick={() => setOpen((value) => !value)}>{open ? <CloseIcon /> : <MenuIcon />}</button>
      <nav id="site-navigation" className={cn("items-center gap-2 text-sm font-semibold text-[var(--muted)] md:flex", open ? "absolute inset-x-4 top-[calc(100%+1px)] flex flex-col items-stretch gap-1 rounded-b-2xl border border-t-0 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_22px_55px_rgba(18,36,31,.12)] md:static md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden")}>
        {navigation.map((item) => <Link key={item.href} className={cn("focus-ring rounded-lg px-3 py-3 hover:text-[var(--forest)] md:py-2", isActive(item.href) && "bg-[var(--mist)] text-[var(--forest)] md:bg-transparent md:underline md:decoration-[var(--signal)] md:underline-offset-8")} aria-current={isActive(item.href) ? "page" : undefined} href={item.href} onClick={closeMenu}>{item.label}</Link>)}
        <Link className="focus-ring mt-2 inline-flex items-center justify-center gap-2 rounded-[.6rem] bg-[var(--forest)] px-5 py-3 text-center text-white hover:bg-[var(--fern)] md:ml-3 md:mt-0 md:py-2.5" href="/sign-in" onClick={closeMenu}>Sign in <ArrowUpRight size={15} /></Link>
      </nav>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer border-t border-[#31574e] bg-[var(--forest)] text-[#dce8e1]"><div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.45fr_1fr_1fr] lg:px-12"><div><Link href="/" className="inline-flex items-center"><span className="text-sm font-extrabold tracking-[.1em] text-white">MIGRATION ACADEMY</span></Link><p className="mt-5 max-w-sm text-sm leading-6 text-[#a9c2b7]">Practical continuing professional development for migration professionals working across Australia and New Zealand.</p><div className="mt-7 grid gap-2 text-xs text-[#a9c2b7]"><p className="font-bold tracking-[.12em] text-[#dce8e1]">BUSINESS DETAILS</p><p>Company: AU &amp; NZ Migration Academy</p><p>Trading as: ANZ Migration Academy</p><p>ABN: 19 700 088 526</p><a className="inline-flex items-center gap-2 hover:text-white" href="tel:+61283808833"><Phone size={14} /> +61 2 8380 8833</a><a className="inline-flex items-center gap-2 hover:text-white" href="mailto:info@anzmigrationacademy.com"><Mail size={14} /> info@anzmigrationacademy.com</a></div></div><div><p className="eyebrow text-[#a9c2b7]">Explore</p><div className="mt-5 grid gap-3 text-sm"><Link href="/classes" className="hover:text-white">CPD activities</Link><Link href="/cpd-requirements" className="hover:text-white">CPD requirements</Link><Link href="/presenters" className="hover:text-white">Meet the presenters</Link><Link href="/classes" className="hover:text-white">Australia & New Zealand</Link></div></div><div><p className="eyebrow text-[#a9c2b7]">Useful information</p><div className="mt-5 grid gap-3 text-sm"><Link href="/register" className="hover:text-white">Register / sign in</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/refund-policy" className="hover:text-white">Refund policy</Link></div></div></div><div className="mx-auto max-w-[1440px] border-t border-[#31574e] px-5 py-5 text-xs leading-5 text-[#a9c2b7] sm:px-8 lg:px-12">© {new Date().getFullYear()} AU &amp; NZ Migration Academy. Trading as ANZ Migration Academy. Course information is educational material and should be checked against current professional requirements.</div></footer>;
}
