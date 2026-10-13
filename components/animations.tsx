"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Shared motion language. Each route uses this controller, including admin and account pages.
export function SiteMotion({ pathname }: { pathname: string }) {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const main = document.querySelector("main");
      if (!main) return;
      const opening = main.querySelectorAll("h1");
      gsap.fromTo(opening, { opacity: 0, y: 32, filter: "blur(5px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05, stagger: .08, ease: "power3.out", clearProps: "filter,transform,opacity" });
      const sections = main.querySelectorAll("h2, article, [data-motion], .metric-tile");
      ScrollTrigger.batch(sections, {
        start: "top 94%",
        once: true,
        onEnter: (elements) => gsap.fromTo(elements, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .8, stagger: .075, ease: "power3.out", clearProps: "opacity,transform" }),
      });
      const floating = main.querySelectorAll("[data-float]");
      floating.forEach(el => gsap.to(el, { yPercent: -9, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: .7 } }));
      const progress = main.querySelectorAll("[data-draw]");
      progress.forEach(el => gsap.fromTo(el, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.25, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));
    });
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { cancelAnimationFrame(refresh); ctx.revert(); };
  }, [pathname]);
  return null;
}

export function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-hero-line]", { y: 36, opacity: 0, duration: .95, ease: "power3.out", stagger: .12, clearProps: "all" });
      gsap.from("[data-hero-meta]", { y: 20, opacity: 0, duration: .75, delay: .22, ease: "power2.out", stagger: .09, clearProps: "all" });
      gsap.to("[data-hero-art]", { yPercent: -8, rotate: 1.5, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: .6 } });
    }, root);
    return () => context.revert();
  }, []);
  return <div ref={root}>{children}</div>;
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(root.current, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .78, ease: "power3.out", clearProps: "opacity,transform", scrollTrigger: { trigger: root.current, start: "top 91%", once: true } });
    }, root);
    return () => context.revert();
  }, []);
  return <div ref={root} className={className}>{children}</div>;
}
