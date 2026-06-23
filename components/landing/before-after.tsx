"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronsLeftRight, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: { before: "SIROVO", after: "VICIRAL", drag: "Prevuci pre/posle", make: "Napravi ovako" },
  en: { before: "RAW", after: "VICIRAL", drag: "Drag before/after", make: "Make this" },
} as const;

/**
 * Before / After reveal slider — the "Seedance glow-up" device. The same scene
 * is shown raw (left, desaturated + scanning sheen) and finished (right, the
 * real generated output). On first scroll-in the divider auto-sweeps from ~88%
 * to 50% (the transformation reveal), then a full-cover invisible range input
 * makes it draggable + keyboard-accessible. The CSS var --pos drives clip-path
 * and the handle imperatively, so dragging never re-renders React.
 */
export function BeforeAfter({
  src,
  alt,
  prompt,
  moduleLabel,
  slug,
  aspect = "16 / 10",
  locale,
}: {
  src: string;
  alt: string;
  prompt: string;
  moduleLabel: string;
  slug: string;
  aspect?: string;
  locale: Locale;
}) {
  const t = T[locale];
  const baRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  function setPos(v: number) {
    const el = baRef.current;
    if (el) el.style.setProperty("--pos", `${v}%`);
    if (rangeRef.current) rangeRef.current.value = String(v);
  }

  useEffect(() => {
    const el = baRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        obs.disconnect();
        if (reduce) {
          setPos(50);
          return;
        }
        const start = performance.now();
        const from = 88;
        const to = 50;
        const dur = 1200;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          setPos(Math.round((from + (to - from) * ease) * 10) / 10);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.45 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <figure className="group">
      <div
        ref={baRef}
        className="ba relative w-full select-none overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_90px_-50px_rgba(139,92,246,0.7)]"
        style={{ aspectRatio: aspect }}
      >
        {/* AFTER — finished, full colour (base layer) */}
        <Image src={src} alt={alt} fill sizes="(min-width: 768px) 36rem, 100vw" className="object-cover" />
        <span className="chip absolute right-3 top-3 z-20 border-violet-400/40 text-white">
          {t.after}
        </span>

        {/* BEFORE — raw, clipped to the left of the divider */}
        <div className="ba-before ba-sheen absolute inset-0 z-10">
          <Image src={src} alt="" aria-hidden fill sizes="(min-width: 768px) 36rem, 100vw" className="ba-raw object-cover" />
          <div aria-hidden className="absolute inset-0 bg-[#07070b]/40" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:26px_26px]"
          />
          <span className="chip absolute left-3 top-3 text-zinc-300">{t.before}</span>
        </div>

        {/* Divider + grip */}
        <div className="ba-divider absolute inset-y-0 z-20 w-px -translate-x-1/2 bg-white/85" aria-hidden>
          <span className="ba-grip absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur-md">
            <ChevronsLeftRight className="h-4 w-4 text-white" strokeWidth={2.2} />
          </span>
        </div>

        {/* Invisible range — full-cover drag + keyboard control */}
        <input
          ref={rangeRef}
          type="range"
          min={0}
          max={100}
          defaultValue={88}
          aria-label={`${t.drag} — ${moduleLabel}`}
          onInput={(e) => setPos(Number((e.target as HTMLInputElement).value))}
          className="ba-range absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <figcaption className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="mono truncate text-xs text-zinc-500">{prompt}</div>
          <div className="mt-0.5 text-sm font-medium text-zinc-200">{moduleLabel}</div>
        </div>
        <Link
          href={`/studio/${slug}`}
          className="mono inline-flex shrink-0 items-center gap-1 text-xs text-violet-300 transition-colors hover:text-violet-200"
        >
          {t.make}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </figcaption>
    </figure>
  );
}
