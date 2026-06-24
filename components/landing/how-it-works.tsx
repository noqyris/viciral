"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ModuleIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "KAKO RADI",
    title: "Tri koraka do ",
    titleHi: "gotovog",
    sub: "Bez ekipe i bez gomile alata — opišeš ideju, izabereš modul, preuzmeš rezultat.",
    steps: [
      {
        kicker: "Korak 01",
        title: "Opiši ideju",
        body: "Napišeš jednu rečenicu o tome šta ti treba — na svom jeziku.",
        prompt: "Set objava za moju kafu — topao, premium ton.",
      },
      {
        kicker: "Korak 02",
        title: "Izaberi modul",
        body: "Viciral orkestrira prave modele — Claude, Nano Banana, Seedance.",
      },
      {
        kicker: "Korak 03",
        title: "Preuzmi i objavi",
        body: "Gotov sadržaj — spreman za preuzimanje i objavu za nekoliko minuta.",
        thumbAlt: "Gotov vertikalni klip, napravljen ovim alatom",
        caption: "napravljeno ovim alatom",
      },
    ],
  },
  en: {
    eyebrow: "HOW IT WORKS",
    title: "Three steps to ",
    titleHi: "done",
    sub: "No crew and no pile of apps — describe the idea, pick a module, download the result.",
    steps: [
      {
        kicker: "Step 01",
        title: "Describe the idea",
        body: "Write one sentence about what you need — in your own language.",
        prompt: "A post pack for my coffee brand — warm, premium tone.",
      },
      {
        kicker: "Step 02",
        title: "Pick a module",
        body: "Viciral orchestrates the real models — Claude, Nano Banana, Seedance.",
      },
      {
        kicker: "Step 03",
        title: "Download & publish",
        body: "Finished content — ready to download and post in a few minutes.",
        thumbAlt: "Finished vertical clip, made with this tool",
        caption: "made with this tool",
      },
    ],
  },
} as const;

/** The three module glyphs shown lighting up inside step 2's "rig". */
const RIG_SLUGS = ["social-pack", "cinematic", "short-form"] as const;

/**
 * Self-drawing gradient connector. Renders fully drawn immediately under
 * reduced motion; otherwise animates stroke-dashoffset → 0 once on reveal.
 * `orientation` swaps between the desktop (horizontal) and mobile (vertical)
 * SVG so the wire always runs along the step flow.
 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function Connector({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const ref = useRef<SVGSVGElement>(null);
  // Under reduced motion the wire starts fully drawn; otherwise it draws on reveal.
  const [drawn, setDrawn] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isH = orientation === "horizontal";
  // One dash the full length of the path, offset by the same so it starts hidden.
  const length = isH ? 1000 : 600;
  const gradId = `wire-${orientation}`;

  return (
    <svg
      ref={ref}
      aria-hidden
      className={
        isH
          ? "pointer-events-none absolute inset-x-0 top-1/2 hidden h-px w-full -translate-y-1/2 overflow-visible md:block"
          : "pointer-events-none absolute bottom-0 left-1/2 top-0 block h-full w-px -translate-x-1/2 overflow-visible md:hidden"
      }
      viewBox={isH ? "0 0 1000 2" : "0 0 2 600"}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2={isH ? "1" : "0"}
          y2={isH ? "0" : "1"}
        >
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <line
        x1={isH ? 0 : 1}
        y1={isH ? 1 : 0}
        x2={isH ? 1000 : 1}
        y2={isH ? 1 : 600}
        stroke={`url(#${gradId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={drawn ? 0 : length}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

/** The little prompt card shown inside step 1. */
function PromptGlyph({ prompt }: { prompt: string }) {
  return (
    <div className="card w-full rounded-xl p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-amber-400/70" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
      </div>
      <p className="mono text-sm leading-relaxed text-zinc-300">
        <span className="text-violet-300">&gt;</span> {prompt}
        <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-violet-400/80 align-middle" />
      </p>
    </div>
  );
}

/** The "rig" of lit module glyphs shown inside step 2. */
function RigGlyph({ label }: { label: string }) {
  return (
    <div className="card flex w-full items-center justify-center gap-3 rounded-xl p-4">
      {RIG_SLUGS.map((slug) => (
        <span
          key={slug}
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-200"
        >
          <ModuleIcon slug={slug} className="h-5 w-5" />
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function HowItWorks({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="section">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal dir="up" className="mb-12 text-center md:mb-16">
          <span className="eyebrow justify-center">
            <span className="h-1 w-1 rounded-full bg-violet-400" aria-hidden />
            {t.eyebrow}
          </span>
          <h2 id="how-it-works-title" className="h2-fluid mt-4 text-white">
            {t.title}
            <span className="gradient-text">{t.titleHi}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400">
            {t.sub}
          </p>
        </Reveal>

        {/* The filmstrip. The connector lives behind the beats on the same
            relative parent so the wire visually threads them. */}
        <div className="relative">
          <Connector orientation="horizontal" />
          <Connector orientation="vertical" />

          <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
            {t.steps.map((step, i) => (
              <li key={step.kicker} className="relative flex">
                <Reveal dir="up" delay={i * 80} className="flex w-full">
                  <article className="card-glow relative flex h-full w-full flex-col gap-4 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-base font-bold text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.9)]">
                        {i + 1}
                      </span>
                      <span className="mono text-xs uppercase tracking-wider text-zinc-500">
                        {step.kicker}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      <p className="mt-2 text-pretty leading-relaxed text-zinc-400">
                        {step.body}
                      </p>
                    </div>

                    {/* Per-step concrete visual */}
                    <div className="mt-auto pt-1">
                      {i === 0 && "prompt" in step && (
                        <PromptGlyph prompt={step.prompt} />
                      )}
                      {i === 1 && <RigGlyph label={step.title} />}
                      {i === 2 && "thumbAlt" in step && (
                        <div className="relative">
                          <span
                            className="bloom"
                            style={{ ["--bloom" as string]: "rgba(56,189,248,0.45)" }}
                            aria-hidden
                          />
                          <div className="relative mx-auto aspect-[9/16] w-full max-w-[150px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                            <Image
                              src="/examples/shortform.png"
                              alt={step.thumbAlt}
                              fill
                              sizes="150px"
                              className="object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                            <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                              <span className="mono text-[10px] text-white/80">
                                {step.caption}
                              </span>
                              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
                                <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal dir="up" delay={240} className="mt-12 flex justify-center md:mt-14">
          <Link href="/signup" className="btn-primary">
            {locale === "sr" ? "Počni besplatno → 200 kredita" : "Start free → 200 credits"}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
