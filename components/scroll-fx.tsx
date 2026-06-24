"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/utils/motion";

/**
 * Scroll-FX engine (Level 2): Lenis smooth scroll + GSAP ScrollTrigger.
 * Elements marked `data-fx="assemble"` fly in from scattered, rotated, scaled-down
 * positions and lock into place as you scroll past them (scrubbed) — the "viral
 * animated site" feel. Fully gated behind prefers-reduced-motion, and `html.fx`
 * hides the targets until GSAP controls them (no flash of un-animated content).
 * Mounted once on the landing; renders nothing.
 */
export function ScrollFX() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    // Lenis drives smooth wheel scrolling; native touch is left untouched.
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", () => ScrollTrigger.update());
    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    const root = document.documentElement;
    root.classList.add("fx"); // CSS hides [data-fx] until GSAP takes over

    const ctx = gsap.context(() => {
      // assemble — fly in scattered/rotated/scaled, lock into place (scrubbed)
      gsap.utils.toArray<HTMLElement>("[data-fx='assemble']").forEach((el) => {
        const i = Number(el.dataset.i ?? 0);
        const dir = i % 2 === 0 ? -1 : 1;
        gsap.fromTo(
          el,
          { opacity: 0, xPercent: 9 * dir, yPercent: 14, rotate: 3 * dir, scale: 0.95 },
          {
            opacity: 1,
            xPercent: 0,
            yPercent: 0,
            rotate: 0,
            scale: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", end: "top 56%", scrub: 0.6 },
          },
        );
      });

      // rise — lighter fade + lift
      gsap.utils.toArray<HTMLElement>("[data-fx='rise']").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, yPercent: 16 },
          {
            opacity: 1,
            yPercent: 0,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", end: "top 64%", scrub: 0.5 },
          },
        );
      });

      // parallax — scroll-linked drift (data-speed scales it; negative = opposite)
      gsap.utils.toArray<HTMLElement>("[data-fx='parallax']").forEach((el) => {
        const speed = Number(el.dataset.speed ?? 1);
        gsap.fromTo(
          el,
          { yPercent: 0 },
          {
            yPercent: -9 * speed,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    });

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      gsap.ticker.remove(onRaf);
      lenis.destroy();
      root.classList.remove("fx");
    };
  }, []);

  return null;
}
