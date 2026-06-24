"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/utils/motion";
import type { Locale } from "@/lib/i18n";

const SHOTS = [
  { src: "/examples/website.png", w: 1344, h: 768 },
  { src: "/examples/social.png", w: 1024, h: 1024 },
  { src: "/examples/food.png", w: 1344, h: 768 },
  { src: "/examples/fashion.png", w: 768, h: 1344 },
  { src: "/examples/realestate.png", w: 1344, h: 768 },
  { src: "/examples/avatar.png", w: 768, h: 1344 },
  { src: "/examples/brand.png", w: 1024, h: 1024 },
  { src: "/examples/fitness.png", w: 768, h: 1344 },
  { src: "/examples/cinematic.png", w: 1344, h: 768 },
  { src: "/examples/saas.png", w: 1344, h: 768 },
  { src: "/examples/shortform.png", w: 768, h: 1344 },
  { src: "/examples/skincare.png", w: 1024, h: 1024 },
];

const T = {
  sr: { eyebrow: "SVE NA JEDNOM MESTU", headA: "Tvoj studio, ", headHi: "u jednom potezu", headB: "." },
  en: { eyebrow: "ALL IN ONE PLACE", headA: "Your studio, ", headHi: "in one sweep", headB: "." },
} as const;

/**
 * Pinned horizontal-scroll reel: the section sticks to the viewport and the row
 * of real outputs slides sideways as you scroll down (GSAP scrub). The pin is
 * pure CSS `position: sticky` (robust with Lenis), so GSAP only drives the
 * translate. Under reduced motion / before JS it degrades to a normal
 * horizontally-scrollable strip.
 */
export default function Reel({ locale }: { locale: Locale }) {
  const t = T[locale];
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    const inner = innerRef.current;
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!section || !inner || !track || !wrap) return;

    gsap.registerPlugin(ScrollTrigger);

    // Upgrade to pinned layout imperatively (SSR markup stays the fallback).
    Object.assign(inner.style, {
      position: "sticky",
      top: "0",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      overflow: "hidden",
    });
    wrap.style.overflow = "hidden";

    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
    const setHeight = () => {
      section.style.height = `${window.innerHeight + dist()}px`;
    };
    setHeight();

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    const onResize = () => {
      setHeight();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
      section.style.height = "";
      inner.removeAttribute("style");
      wrap.style.overflow = "";
    };
  }, []);

  return (
    <section ref={sectionRef} id="reel" aria-label={`${t.headA}${t.headHi}`} className="relative section-pit">
      <div ref={innerRef} className="flex flex-col justify-center gap-8 py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <p className="eyebrow">
            <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
            {t.eyebrow}
          </p>
          <h2 className="h2-fluid mt-3 max-w-3xl text-white">
            {t.headA}
            <span className="gradient-text">{t.headHi}</span>
            {t.headB}
          </h2>
        </div>
        <div ref={wrapRef} className="overflow-x-auto">
          <div ref={trackRef} className="flex w-max items-center gap-5 px-6 will-change-transform">
            {SHOTS.map((s, i) => (
              <div
                key={i}
                className="relative h-[42vh] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_90px_-55px_rgba(139,92,246,0.7)]"
                style={{ aspectRatio: `${s.w} / ${s.h}` }}
              >
                <Image src={s.src} alt="" aria-hidden fill sizes="60vh" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
