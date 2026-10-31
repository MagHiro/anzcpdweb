"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { VisitorPreferences } from "@/components/visitor-preferences";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const workspace = pathname.startsWith("/admin") || (pathname.startsWith("/account") && pathname !== "/account/setup");
  return <div data-page={pathname} className={workspace ? "application-workspace" : "academy-site"}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {!workspace && <SiteHeader />}
    <main id="main-content" tabIndex={-1}>{children}</main>
    {!workspace && <SiteFooter />}
    {!workspace && <VisitorPreferences />}
  </div>;
}
