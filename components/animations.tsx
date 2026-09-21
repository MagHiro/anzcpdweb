"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-hero-line]", { y: 28, opacity: 0, duration: .8, ease: "power3.out", stagger: .08 });
      gsap.from("[data-hero-meta]", { y: 16, opacity: 0, duration: .7, delay: .2, ease: "power2.out", stagger: .06 });
      gsap.to("[data-hero-art]", { yPercent: -10, rotate: 2, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
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
      gsap.from(root.current, { y: 20, opacity: 0, duration: .65, ease: "power2.out", scrollTrigger: { trigger: root.current, start: "top 88%", once: true } });
    }, root);
    return () => context.revert();
  }, []);
  return <div ref={root} className={className}>{children}</div>;
}
