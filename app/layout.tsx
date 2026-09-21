import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import { SiteFooter } from "@/components/site-header";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "ANZ CPD | ANZ Migration Academy", template: "%s | ANZ CPD" },
  description: "Focused continuing professional development activities for migration professionals in Australia and New Zealand.",
  openGraph: { type: "website", siteName: "ANZ Migration Academy", title: "ANZ Migration Academy", description: "Continuing professional development for migration professionals in Australia and New Zealand." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-AU" className={googleSansFlex.className} data-scroll-behavior="smooth"><body><SiteHeader /><main>{children}</main><SiteFooter /></body></html>;
}
