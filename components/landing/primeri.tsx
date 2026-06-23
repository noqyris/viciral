"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  PostMock,
  VideoMock,
  VerticalMock,
  BrowserMock,
  BrandMock,
} from "@/components/landing-mocks";
import { ModuleIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "PRAVO, NE RENDERI",
    titleLead: "Sve ovo je napravljeno",
    titleGrad: "ovim alatom",
    sub: "Pravi primeri — napravljeni baš ovim alatom, bez ekipe i alata.",
    galleryLabel: "Galerija pravih primera",
    avatarCaption: "Predstavi proizvod, bez kamere.",
    shortCaption: "Hook u prve 3 sekunde.",
    open: "Otvori",
    tiles: {
      avatar: { name: "Avatar", verb: "Avatar" },
      website: { name: "Website Builder", verb: "Sajt" },
      social: { name: "Social Media Paket", verb: "Objava" },
      cinematic: { name: "Cinematic Video", verb: "Video" },
      brand: { name: "Brand Kit", verb: "Brend" },
      short: { name: "Short-Form Klipovi", verb: "Klip" },
    },
  },
  en: {
    eyebrow: "REAL, NOT RENDERS",
    titleLead: "All of this was made",
    titleGrad: "with this tool",
    sub: "Real examples — made with this exact tool, no team and no other apps.",
    galleryLabel: "Gallery of real examples",
    avatarCaption: "Present your product, no camera.",
    shortCaption: "Hook in the first 3 seconds.",
    open: "Open",
    tiles: {
      avatar: { name: "Avatar", verb: "Avatar" },
      website: { name: "Website Builder", verb: "Site" },
      social: { name: "Social Media Pack", verb: "Post" },
      cinematic: { name: "Cinematic Video", verb: "Video" },
      brand: { name: "Brand Kit", verb: "Brand" },
      short: { name: "Short-Form Clips", verb: "Clip" },
    },
  },
} as const;

/** Per-tile bloom hue, drawn from the three brand stops. */
const BLOOM = {
  violet: "rgba(139, 92, 246, 0.45)",
  indigo: "rgba(99, 102, 241, 0.42)",
  sky: "rgba(56, 189, 248, 0.38)",
} as const;

type TileMeta = { name: string; verb: string };

/**
 * Cursor-tilt + lift island. Tilts the tile toward the pointer via CSS vars,
 * capped and rAF-throttled, pointer-fine only, and a no-op under reduced motion.
 * The whole tile is a Link to its module.
 */
function Tile({
  href,
  slug,
  meta,
  bloom,
  openLabel,
  className = "",
  children,
}: {
  href: string;
  slug: string;
  meta: TileMeta;
  bloom: string;
  openLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const bloomRef = useRef<HTMLSpanElement>(null);
  const raf = useRef<number | null>(null);

  // Tilt toward the cursor (pointer-fine + motion allowed only).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX = 6; // degrees, capped

    const onMove = (e: PointerEvent) => {
      if (raf.current != null) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--rx", `${(-py * MAX).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(px * MAX).toFixed(2)}deg`);
      });
    };
    const reset = () => {
      if (raf.current != null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      reset();
    };
  }, []);

  // Light the per-scene bloom when the tile enters view.
  useEffect(() => {
    const el = bloomRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-lit");
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={`${meta.name} — ${openLabel}`}
      style={
        {
          "--rx": "0deg",
          "--ry": "0deg",
          transform:
            "perspective(1100px) rotateX(var(--rx)) rotateY(var(--ry))",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        } as React.CSSProperties
      }
      className={`group card-glow relative block h-full overflow-hidden p-3 [transform-style:preserve-3d] ${className}`}
    >
      <span
        ref={bloomRef}
        className="bloom"
        style={{ ["--bloom" as string]: bloom }}
        aria-hidden
      />

      {/* The real output mock */}
      <div className="relative grid h-full place-items-center [transform:translateZ(20px)]">
        {children}
      </div>

      {/* Corner label chip */}
      <span className="chip pointer-events-none absolute left-3.5 top-3.5 z-10 [transform:translateZ(36px)]">
        <ModuleIcon slug={slug} className="h-3.5 w-3.5 text-violet-300" />
        <span className="font-semibold text-zinc-200">{meta.verb}</span>
      </span>

      {/* Open affordance */}
      <span className="pointer-events-none absolute bottom-3.5 right-3.5 z-10 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 opacity-0 transition-opacity duration-200 [transform:translateZ(36px)] group-hover:opacity-100 group-focus-visible:opacity-100">
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
    </Link>
  );
}

export default function Primeri({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section
      id="primeri"
      aria-labelledby="primeri-title"
      className="section section-pit relative scroll-mt-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Header */}
        <Reveal dir="up">
          <p className="eyebrow">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-violet-400"
            />
            {t.eyebrow}
          </p>
        </Reveal>

        <Reveal dir="up" delay={60}>
          <h2 id="primeri-title" className="h2-fluid mt-4 max-w-3xl text-white">
            {t.titleLead}{" "}
            <span className="gradient-text">{t.titleGrad}</span>.
          </h2>
        </Reveal>

        <Reveal dir="up" delay={120}>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400">
            {t.sub}
          </p>
        </Reveal>

        {/* Asymmetric bento.
            Mobile: single column. Desktop: 12-col grid honoring each true ratio. */}
        <ul
          aria-label={t.galleryLabel}
          className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12 lg:grid-rows-[repeat(7,auto)]"
        >
          {/* Tall 9:16 avatar feature tile (spans both rows on desktop) */}
          <li className="lg:col-span-4 lg:row-span-7">
            <Reveal dir="up" className="h-full">
              <Tile
                href="/studio/avatar"
                slug="avatar"
                meta={t.tiles.avatar}
                bloom={BLOOM.violet}
                openLabel={t.open}
              >
                <VerticalMock
                  src="/examples/avatar.png"
                  alt={t.tiles.avatar.name}
                  caption={t.avatarCaption}
                  locale={locale}
                />
              </Tile>
            </Reveal>
          </li>

          {/* Wide 16:10 website browser */}
          <li className="lg:col-span-5 lg:row-span-4">
            <Reveal dir="up" delay={60} className="h-full">
              <Tile
                href="/studio/website"
                slug="website"
                meta={t.tiles.website}
                bloom={BLOOM.sky}
                openLabel={t.open}
              >
                <BrowserMock locale={locale} />
              </Tile>
            </Reveal>
          </li>

          {/* Square social post */}
          <li className="lg:col-span-3 lg:row-span-4">
            <Reveal dir="up" delay={120} className="h-full">
              <Tile
                href="/studio/social-pack"
                slug="social-pack"
                meta={t.tiles.social}
                bloom={BLOOM.indigo}
                openLabel={t.open}
              >
                <PostMock locale={locale} />
              </Tile>
            </Reveal>
          </li>

          {/* 16:9 cinematic video */}
          <li className="lg:col-span-5 lg:row-span-3">
            <Reveal dir="up" delay={180} className="h-full">
              <Tile
                href="/studio/cinematic"
                slug="cinematic"
                meta={t.tiles.cinematic}
                bloom={BLOOM.violet}
                openLabel={t.open}
              >
                <VideoMock
                  src="/examples/cinematic.png"
                  alt={t.tiles.cinematic.name}
                />
              </Tile>
            </Reveal>
          </li>

          {/* Brand board (real square board inside) */}
          <li className="lg:col-span-3 lg:row-span-3">
            <Reveal dir="up" delay={240} className="h-full">
              <Tile
                href="/studio/brand-kit"
                slug="brand-kit"
                meta={t.tiles.brand}
                bloom={BLOOM.sky}
                openLabel={t.open}
              >
                <BrandMock locale={locale} />
              </Tile>
            </Reveal>
          </li>

          {/* Second vertical: short-form clip with viral score */}
          <li className="lg:col-span-4 lg:row-span-3">
            <Reveal dir="up" delay={300} className="h-full">
              <Tile
                href="/studio/short-form"
                slug="short-form"
                meta={t.tiles.short}
                bloom={BLOOM.indigo}
                openLabel={t.open}
              >
                <VerticalMock
                  src="/examples/shortform.png"
                  alt={t.tiles.short.name}
                  caption={t.shortCaption}
                  score={92}
                  locale={locale}
                />
              </Tile>
            </Reveal>
          </li>
        </ul>
      </div>
    </section>
  );
}
