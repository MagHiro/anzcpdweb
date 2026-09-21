"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth-form";
const adminGroups = [
  { label: "Workspace", links: [["/admin", "Overview"]] },
  { label: "Catalogue", links: [["/admin/classes", "Classes"], ["/admin/categories", "Categories"], ["/admin/presenters", "Presenters"], ["/admin/source-references", "Source references"]] },
  { label: "Operations", links: [["/admin/bookings", "Bookings"], ["/admin/customers", "Customers"]] },
  { label: "Finance", links: [["/admin/payments", "Payments"], ["/admin/refunds", "Refunds"]] },
  { label: "System", links: [["/admin/audit-log", "Audit log"], ["/admin/settings", "Settings"]] },
];
const accountGroups = [{ label: "Your learning", links: [["/account", "Overview"], ["/account/bookings", "My bookings"]] }, { label: "Account", links: [["/account/profile", "Profile"], ["/account/security", "Security"]] }];
export function Workspace({ children, name, admin = false }: { children: ReactNode; name: string; admin?: boolean }) {
  const pathname = usePathname();
  const groups = admin ? adminGroups : accountGroups;
  const active = (href: string) => pathname === href || (href !== "/admin" && href !== "/account" && pathname.startsWith(`${href}/`));
  return <div className={`workspace ${admin ? "workspace-admin" : "workspace-account"}`}><aside className="workspace-sidebar"><Link href="/" className="workspace-brand"><span className="workspace-wordmark">CPD ACADEMY</span><span><small>{admin ? "Administration" : "Your learning space"}</small></span></Link><nav aria-label={admin ? "Administration" : "Account"}>{groups.map(group => <div className="workspace-nav-group" key={group.label}><p>{group.label}</p>{group.links.map(([href, label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}><span>{label}</span><span aria-hidden="true">{active(href) ? "●" : "↗"}</span></Link>)}</div>)}</nav><div className="workspace-identity"><span className="identity-avatar">{name.slice(0, 1).toUpperCase()}</span><div><p>{name}</p><SignOutButton /></div></div></aside><div className="workspace-body"><header className="workspace-topbar"><span>{admin ? "Academy operations" : "Welcome to your account"}</span><Link href="/classes">Browse CPD activities ↗</Link></header><div className="workspace-content">{children}</div><footer className="workspace-footer">Migration Academy <span>Need help? <a href="mailto:info@anzmigrationacademy.com">Contact the academy</a></span></footer></div></div>;
}
