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
      gsap.from("[data-hero-line]", { y: 34, duration: .85, ease: "power3.out", stagger: .08 });
      gsap.from("[data-hero-meta]", { y: 18, duration: .7, delay: .35, ease: "power2.out" });
      gsap.to("[data-hero-orb]", { yPercent: -14, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
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
      gsap.from(root.current, { y: 24, duration: .75, ease: "power2.out", scrollTrigger: { trigger: root.current, start: "top 88%", once: true } });
    }, root);
    return () => context.revert();
  }, []);
  return <div ref={root} className={className}>{children}</div>;
}
