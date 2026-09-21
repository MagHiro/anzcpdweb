import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "ANZ CPD | ANZ Migration Academy", template: "%s | ANZ CPD" },
  description: "Focused continuing professional development activities for migration professionals in Australia and New Zealand.",
  openGraph: { type: "website", siteName: "ANZ Migration Academy", title: "ANZ Migration Academy", description: "Continuing professional development for migration professionals in Australia and New Zealand." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-AU" className={googleSansFlex.className} data-scroll-behavior="smooth"><body><AppChrome>{children}</AppChrome></body></html>;
}
