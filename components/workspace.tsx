"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth-form";
import { AdminFeedback } from "@/components/admin-feedback";
import gsap from "gsap";
import "@/components/admin-workspace.css";

type NavItem = { href: string; label: string; icon: "grid" | "book" | "users" | "calendar" | "money" | "settings" | "file" | "shield" | "message" | "spark" };
type NavGroup = { label: string; links: NavItem[] };
const adminGroups: NavGroup[] = [
  { label: "Workspace", links: [{ href: "/admin", label: "Overview", icon: "grid" }] },
  { label: "Learning", links: [{ href: "/admin/classes", label: "Classes", icon: "book" }, { href: "/admin/categories", label: "Categories", icon: "grid" }, { href: "/admin/presenters", label: "Presenters", icon: "users" }, { href: "/admin/source-references", label: "Source references", icon: "file" }] },
  { label: "Operations", links: [{ href: "/admin/operations", label: "Queues", icon: "grid" }, { href: "/admin/bookings", label: "Bookings", icon: "calendar" }, { href: "/admin/customers", label: "Customers", icon: "users" }, { href: "/admin/complaints", label: "Complaints", icon: "message" }] },
  { label: "Finance", links: [{ href: "/admin/payments", label: "Payments", icon: "money" }, { href: "/admin/refunds", label: "Refunds", icon: "money" }] },
  { label: "System", links: [{ href: "/admin/audit-log", label: "Audit log", icon: "shield" }, { href: "/admin/settings", label: "Settings", icon: "settings" }] },
];
const accountGroups: NavGroup[] = [
  { label: "Your learning", links: [{ href: "/account", label: "Overview", icon: "grid" }, { href: "/account/bookings", label: "My bookings", icon: "calendar" }, { href: "/account/support", label: "Support", icon: "message" }] },
  { label: "Your account", links: [{ href: "/account/profile", label: "Profile", icon: "users" }, { href: "/account/security", label: "Security", icon: "shield" }] },
];
const paths: Record<NavItem["icon"], ReactNode> = {
  grid: <><rect x="3.8" y="3.8" width="6.5" height="6.5" rx="1.4" /><rect x="13.7" y="3.8" width="6.5" height="6.5" rx="1.4" /><rect x="3.8" y="13.7" width="6.5" height="6.5" rx="1.4" /><rect x="13.7" y="13.7" width="6.5" height="6.5" rx="1.4" /></>,
  book: <><path d="M12 5.4C9.7 3.9 7.2 3.6 3.5 4.2v14.1c3.7-.6 6.2-.3 8.5 1.2 2.3-1.5 4.8-1.8 8.5-1.2V4.2c-3.7-.6-6.2-.3-8.5 1.2ZM12 5.4v14.1" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.2a5.5 5.5 0 0 1 11 0V19H3.5ZM16 5.2a3 3 0 0 1 0 5.7M17 14.1a4.5 4.5 0 0 1 3.5 4.4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7.5 3v4M16.5 3v4M3 10h18M8 14h3M8 17h6" /></>,
  money: <><rect x="2.6" y="5.2" width="18.8" height="13.6" rx="2.4" /><circle cx="12" cy="12" r="3" /><path d="M6 9h.01M18 15h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3.1" /><path d="m9.8 3.6-.5 1.9-1.8 1-1.9-.5-1.5 2.7 1.4 1.4v2l-1.4 1.4 1.5 2.7 1.9-.5 1.8 1 .5 1.9h3.1l.5-1.9 1.8-1 1.9.5 1.5-2.7-1.4-1.4v-2l1.4-1.4-1.5-2.7-1.9.5-1.8-1-.5-1.9z" transform="translate(0 1)" /></>,
  file: <><path d="M6 3.5h8l4 4V20H6zM14 3.5V8h4M9 12h6M9 15.5h6" /></>,
  shield: <><path d="M12 2.6 19.5 6v5.3c0 5.1-3.1 8.2-7.5 10.1-4.4-1.9-7.5-5-7.5-10.1V6L12 2.6Z" /><path d="m8.8 11.7 2.2 2.2 4.3-4.3" /></>,
  message: <><path d="M5 4.5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5.5 3v-5A2 2 0 0 1 3 16V6.5a2 2 0 0 1 2-2Z" /><path d="M7.5 10h9M7.5 13.5h6" /></>,
  spark: <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" />,
};
function NavGlyph({ name }: { name: NavItem["icon"] }) {
  return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Workspace({ children, name, admin = false }: { children: ReactNode; name: string; admin?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(content.current, { opacity: .5, y: 6 }, { opacity: 1, y: 0, duration: .18, ease: "power2.out", clearProps: "all" });
    });
    return () => motion.revert();
  }, [pathname]);
  const groups = admin ? adminGroups : accountGroups;
  const active = (href: string) => pathname === href || (href !== "/admin" && href !== "/account" && pathname.startsWith(href + "/"));
  const current = groups.flatMap(g => g.links).find(item => active(item.href) && (item.href !== "/admin" && item.href !== "/account")) ?? groups[0].links[0];
  return <AdminFeedback><div className={"workspace " + (admin ? "workspace-admin" : "workspace-account")}>
    <a href="#workspace-main" className="workspace-skip">Skip to content</a>
    <aside className="workspace-sidebar">
      <Link href="/" className="workspace-brand focus-ring"><span className="workspace-symbol" aria-hidden="true">A<span>↗</span></span><span className="workspace-brand-label">ANZ Academy<small>{admin ? "Administration" : "My account"}</small></span></Link>
      <button type="button" className="workspace-menu-toggle focus-ring" aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? "Close menu ×" : "Menu ☰"}</button>
      <nav id="workspace-navigation" data-open={menuOpen} aria-label={admin ? "Administration" : "Account"}>{groups.map(group => <details className="workspace-nav-group" key={group.label} open><summary>{group.label}</summary>{group.links.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active(item.href) ? "page" : undefined}><NavGlyph name={item.icon} /><span>{item.label}</span>{active(item.href) && <span className="workspace-active-dot" aria-hidden="true" />}</Link>)}</details>)}</nav>
      <div className="workspace-identity"><span className="identity-avatar" aria-hidden="true">{name.trim().split(/\s+/).filter(Boolean).filter((_, index, words) => index === 0 || index === words.length - 1).map(word => word[0]).join("").toUpperCase()}</span><div><p title={name}>{name}</p><SignOutButton /></div></div>
    </aside>
    <div className="workspace-body">
      <header className="workspace-topbar"><div><span className="workspace-location">{admin ? "Administration" : "My learning"} / <strong>{current.label}</strong></span></div><Link href="/classes">Explore CPD activities <span aria-hidden="true">↗</span></Link></header>
      <main id="workspace-main" tabIndex={-1} ref={content} className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>ANZ Migration Academy</span><span>Need support? <Link href="/complaints">Complaints</Link> · <a href="mailto:info@anzmigrationacademy.com">Contact the academy</a></span></footer>
    </div>
  </div></AdminFeedback>;
}
