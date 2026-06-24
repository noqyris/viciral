"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "@/components/reveal";
import { PostMock, VerticalMock, BrandMock } from "@/components/landing-mocks";
import { prefersReducedMotion } from "@/lib/utils/motion";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    heroBadge: "Orkestracija više modela",
    heroTitleA: "Napravi ono ",
    heroTitleHi: "što sam",
    heroTitleB: " ne možeš.",
    heroSub:
      "Jedan alat spaja najbolje AI modele — Claude za tekst, Nano Banana (Gemini) za slike, Seedance za video — pa od ideje dobiješ ceo set sadržaja za minut, bez tima i bez tehničke muke.",
    ctaCredits: "Počni besplatno → 200 kredita",
    seeExamples: "Vidi prave primere",
    chipCredits: "200 kredita",
    chipNoCard: "bez kartice",
    chipMade: "napravljeno ovim alatom",
    powers: "Pokreće:",
    scroll: "scroll",
    constellationLabel: "Pravi rezultati napravljeni ovim alatom",
    shortAlt: "Primer vertikalnog klipa napravljen ovim alatom",
    shortCaption: "Lansiranje za 24h ⚡",
  },
  en: {
    heroBadge: "Multi-model orchestration",
    heroTitleA: "Make what you ",
    heroTitleHi: "can't",
    heroTitleB: " alone.",
    heroSub:
      "One tool unites the best AI models — Claude for copy, Nano Banana (Gemini) for images, Seedance for video — so an idea becomes a full content set in a minute, with no team and no technical hassle.",
    ctaCredits: "Start free → 200 credits",
    seeExamples: "See real examples",
    chipCredits: "200 credits",
    chipNoCard: "no card",
    chipMade: "made with this tool",
    powers: "Powered by:",
    scroll: "scroll",
    constellationLabel: "Real outputs made with this tool",
    shortAlt: "Vertical clip example made with this tool",
    shortCaption: "Launch in 24h ⚡",
  },
} as const;

const MODELS = ["Claude", "Nano Banana (Gemini)", "Seedance", "Whisper", "Recraft"] as const;

export default function Hero({ locale }: { locale: Locale }) {
  const t = T[locale];
  const heroRef = useRef<HTMLElement>(null);

  // Scroll choreography: a light orb travels down through the constellation; as
  // it passes, the three real-output cards spread apart (via CSS vars, so it
  // never fights their layout transforms) and a backlight blooms behind them.
  // The hero pins so it holds in view while the light sweeps through.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const hero = heroRef.current;
    if (!hero) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: hero, start: "top top", end: "+=72%", scrub: 0.5, pin: true },
      });
      tl.fromTo("[data-orb]", { top: "-18%", opacity: 0 }, { top: "112%", opacity: 0.95, ease: "none" }, 0)
        .fromTo("[data-backlight]", { opacity: 0.1, scale: 0.65 }, { opacity: 0.85, scale: 1.12, ease: "none" }, 0)
        .to("[data-tile='0']", { "--sx": "-66px", "--sy": "-26px", "--rot": "-12deg", ease: "none" }, 0)
        .to("[data-tile='1']", { "--sx": "74px", "--sy": "-12px", "--rot": "12deg", ease: "none" }, 0)
        .to("[data-tile='2']", { "--sy": "60px", "--rot": "4deg", scale: 1.03, ease: "none" }, 0);
    }, hero);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      aria-label={locale === "sr" ? "Naslovna" : "Hero"}
      className="section-pit relative isolate flex min-h-[92vh] items-center overflow-hidden"
    >
      {/* Soft top tint so the deep pit reads "lit", not flat (self-contained). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(99,102,241,0.16),transparent_60%)]"
      />

      <div className="section mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-28 lg:grid-cols-[58fr_42fr] lg:gap-10">
        {/* ---------- LEFT: copy ---------- */}
        <div className="text-center lg:text-left">
          <Reveal dir="up">
            <span className="eyebrow justify-center lg:justify-start">
              <span aria-hidden className="relative grid h-2 w-2 place-items-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/70 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
              </span>
              {t.heroBadge}
            </span>
          </Reveal>

          <Reveal dir="up" delay={80}>
            <h1 className="display mt-5 text-white">
              {t.heroTitleA}
              <span className="gradient-text">{t.heroTitleHi}</span>
              {t.heroTitleB}
            </h1>
          </Reveal>

          <Reveal dir="up" delay={160}>
            <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-zinc-400 lg:mx-0">
              {t.heroSub}
            </p>
          </Reveal>

          <Reveal dir="up" delay={240}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/signup" className="btn-primary w-full sm:w-auto">
                {t.ctaCredits}
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </Link>
              <Link href="#examples" className="btn-ghost w-full sm:w-auto">
                {t.seeExamples}
              </Link>
            </div>
          </Reveal>

          <Reveal dir="up" delay={320}>
            <ul className="mono mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[13px] text-zinc-500 lg:justify-start">
              <li>{t.chipCredits}</li>
              <li aria-hidden className="text-zinc-700">·</li>
              <li>{t.chipNoCard}</li>
              <li aria-hidden className="text-zinc-700">·</li>
              <li className="text-violet-300/90">{t.chipMade}</li>
            </ul>
          </Reveal>
        </div>

        {/* ---------- RIGHT: constellation the light sweeps through ---------- */}
        <Reveal dir="right" delay={200} className="relative">
          <div
            role="img"
            aria-label={t.constellationLabel}
            className="relative mx-auto h-[34rem] w-full max-w-md sm:h-[38rem] lg:h-[40rem]"
          >
            {/* backlight — blooms as the orb passes */}
            <div
              data-backlight
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.5),transparent_66%)] blur-3xl"
            />

            {/* traveling light orb */}
            <div
              data-orb
              aria-hidden
              className="pointer-events-none absolute left-1/2 z-20 h-44 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,180,254,0.9),rgba(99,102,241,0.35)_45%,transparent_70%)] mix-blend-screen blur-2xl"
            />

            {/* Behind-left: brand board */}
            <div
              data-tile="0"
              style={{ ["--sx" as string]: "0px", ["--sy" as string]: "0px", ["--rot" as string]: "-6deg" }}
              className="absolute -left-2 top-6 hidden w-[58%] [transform:translate3d(var(--sx),var(--sy),0)_rotate(var(--rot))] sm:block"
            >
              <div className="float" style={{ ["--dur" as string]: "9s", ["--amp" as string]: "7px" }}>
                <div className="origin-bottom-left scale-[0.92] opacity-90">
                  <BrandMock locale={locale} />
                </div>
              </div>
            </div>

            {/* Behind-up-right: vertical short-form clip */}
            <div
              data-tile="1"
              style={{ ["--sx" as string]: "0px", ["--sy" as string]: "0px", ["--rot" as string]: "6deg" }}
              className="absolute -right-1 top-0 hidden w-[46%] [transform:translate3d(var(--sx),var(--sy),0)_rotate(var(--rot))] sm:block"
            >
              <div className="float" style={{ ["--dur" as string]: "8s", ["--amp" as string]: "11px" }}>
                <VerticalMock
                  src="/examples/shortform.png"
                  alt={t.shortAlt}
                  caption={t.shortCaption}
                  score={92}
                  locale={locale}
                />
              </div>
            </div>

            {/* Front/largest: the Instagram post */}
            <div
              data-tile="2"
              style={{ ["--sx" as string]: "0px", ["--sy" as string]: "0px", ["--rot" as string]: "-2deg" }}
              className="absolute bottom-0 left-1/2 z-10 w-[88%] max-w-sm [transform:translate3d(calc(-50%+var(--sx)),var(--sy),0)_rotate(var(--rot))] sm:bottom-4 sm:left-auto sm:right-2 sm:[transform:translate3d(var(--sx),var(--sy),0)_rotate(var(--rot))]"
            >
              <div className="float" style={{ ["--dur" as string]: "7s", ["--amp" as string]: "9px" }}>
                <PostMock locale={locale} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Underneath: the real engine line */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-6 pb-7 lg:justify-start">
          <span className="mono text-[13px] uppercase tracking-wider text-zinc-500">{t.powers}</span>
          {MODELS.map((m) => (
            <span key={m} className="chip">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <Link
        href="#examples"
        aria-label={locale === "sr" ? "Skroluj na primere" : "Scroll to examples"}
        className="mono absolute bottom-7 right-6 hidden items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-300 lg:inline-flex"
      >
        {t.scroll}
        <ChevronDown className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none" strokeWidth={2} aria-hidden />
      </Link>
    </section>
  );
}
