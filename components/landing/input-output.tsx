"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import {
  PostMock,
  VideoMock,
  VerticalMock,
  BrandMock,
  BrowserMock,
} from "@/components/landing-mocks";
import { Reveal } from "@/components/reveal";
import { prefersReducedMotion, animateValue } from "@/lib/utils/motion";
import type { Locale } from "@/lib/i18n";

/**
 * Input → Output reel: each of the six honest pain/gain pairs is staged as an
 * alternating two-column "scene" — a faux studio input card (typed mono prompt
 * + glowing Generiši button) wired by an animated gradient flow-line to the
 * REAL example mock. A per-scene bloom shifts the page's color temperature as
 * you scroll. All motion (typing, flow-line draw, score count-up, parallax)
 * runs once on enter and shows its final state instantly under reduced motion.
 */

type SceneId =
  | "social-pack"
  | "cinematic"
  | "avatar"
  | "brand-kit"
  | "website"
  | "short-form";

type Copy = {
  prompt: string;
  generate: string;
  try: string;
  inputLabel: string;
  outputLabel: string;
};

type SceneCopy = {
  eyebrow: string;
  title: string;
  prompt: string;
  pain: string;
  gain: string;
};

const T = {
  sr: {
    eyebrow: "OD JEDNE REČENICE DO GOTOVOG",
    heading: "Jedan prompt unutra, gotov materijal napolju",
    sub: "Ovo je ceo proizvod u malom: napišeš šta hoćeš, a više modela uradi posao. Sve dole je napravljeno ovim alatom.",
    ui: {
      prompt: "tema:",
      generate: "Generiši",
      try: "Probaj",
      inputLabel: "Unos",
      outputLabel: "Rezultat",
    } satisfies Copy,
    scenes: {
      "social-pack": {
        eyebrow: "SOCIAL MEDIA PAKET",
        title: "Ceo set objava za minut",
        prompt: "tema: lansiranje nove kolekcije kafe",
        pain: "Sat vremena u Canvi, pa traženje captiona, pa hashtagovi napamet.",
        gain: "Slika, caption i hashtagovi — spreman set objava za minut.",
      },
      cinematic: {
        eyebrow: "CINEMATIC VIDEO",
        title: "Filmski kadar iz rečenice",
        prompt: "scena: zrna kafe padaju u usporenom snimku, topla svetlost",
        pain: "Snimanje, oprema, montaža — ili skupa produkcija za jedan klip.",
        gain: "Cinematic kadar 16:9 iz opisa — bez kamere i ekipe.",
      },
      avatar: {
        eyebrow: "AVATAR / PRESENTER",
        title: "Voditelj koji izgovori tvoj tekst",
        prompt: "tekst: „Predstavljamo našu novu sezonsku mešavinu.”",
        pain: "Kamera, mikrofon, svetlo i puno snimanja da progovoriš pred publikom.",
        gain: "Avatar koji izgovori tvoj tekst — vertikalni klip, spreman za objavu.",
      },
      "brand-kit": {
        eyebrow: "BRAND KIT",
        title: "Identitet brenda na jednom mestu",
        prompt: "brend: specialty kafa, topao i samouveren ton",
        pain: "Brifovanje dizajnera, runde ispravki i nedelje čekanja na logo i paletu.",
        gain: "Logo, paleta i ton glasa — kompletna brend tabla odmah.",
      },
      website: {
        eyebrow: "WEBSITE BUILDER",
        title: "Sajt spreman za poručivanje",
        prompt: "sajt: landing za kafe brend sa dugmetom „Poruči”",
        pain: "Šablon koji se ne uklapa, sati podešavanja i tekst koji sam pišeš.",
        gain: "Gotov landing sa hero sekcijom i pozivom na akciju — odmah online.",
      },
      "short-form": {
        eyebrow: "SHORT-FORM KLIPOVI",
        title: "Vertikalni klip koji hvata pažnju",
        prompt: "klip: 9:16 hook za Reels, dinamičan rez, prvi kadar = kuka",
        pain: "Sečenje po sekundu, biranje hookova i nagađanje šta će proći.",
        gain: "Vertikalni klip spreman za Reels i TikTok — sa procenom potencijala.",
      },
    } satisfies Record<SceneId, SceneCopy>,
  },
  en: {
    eyebrow: "FROM ONE SENTENCE TO FINISHED",
    heading: "One prompt in, a finished asset out",
    sub: "This is the whole product in miniature: you write what you want, several models do the work. Everything below was made with this tool.",
    ui: {
      prompt: "topic:",
      generate: "Generate",
      try: "Try it",
      inputLabel: "Input",
      outputLabel: "Output",
    } satisfies Copy,
    scenes: {
      "social-pack": {
        eyebrow: "SOCIAL MEDIA PACK",
        title: "A whole post set in a minute",
        prompt: "topic: launching a new coffee collection",
        pain: "An hour in Canva, then hunting for a caption, then guessing hashtags.",
        gain: "Image, caption and hashtags — a ready post set in a minute.",
      },
      cinematic: {
        eyebrow: "CINEMATIC VIDEO",
        title: "A film frame from a sentence",
        prompt: "scene: coffee beans falling in slow motion, warm light",
        pain: "Filming, gear, editing — or an expensive shoot for a single clip.",
        gain: "A 16:9 cinematic shot from a description — no camera, no crew.",
      },
      avatar: {
        eyebrow: "AVATAR / PRESENTER",
        title: "A presenter who speaks your script",
        prompt: "script: “Introducing our new seasonal blend.”",
        pain: "Camera, mic, lighting and lots of takes to speak to your audience.",
        gain: "An avatar that speaks your script — a vertical clip, ready to post.",
      },
      "brand-kit": {
        eyebrow: "BRAND KIT",
        title: "Your brand identity in one place",
        prompt: "brand: specialty coffee, warm and confident tone",
        pain: "Briefing a designer, rounds of edits and weeks waiting on a logo.",
        gain: "Logo, palette and tone of voice — a complete brand board, instantly.",
      },
      website: {
        eyebrow: "WEBSITE BUILDER",
        title: "A site ready to take orders",
        prompt: "site: landing for a coffee brand with an “Order” button",
        pain: "A template that never fits, hours of tweaking and copy you write yourself.",
        gain: "A finished landing with a hero and a call to action — online right away.",
      },
      "short-form": {
        eyebrow: "SHORT-FORM CLIPS",
        title: "A vertical clip that grabs attention",
        prompt: "clip: 9:16 Reels hook, dynamic cuts, first frame = the hook",
        pain: "Cutting second by second, picking hooks and guessing what lands.",
        gain: "A vertical clip ready for Reels and TikTok — with a potential score.",
      },
    } satisfies Record<SceneId, SceneCopy>,
  },
} as const;

/**
 * Per-scene accent: `bloom` feeds the inline --bloom (soft glow behind the
 * mock), `dot` is the solid eyebrow marker. Hues match each module's existing
 * color temperature so the page warms/cools as you scroll the reel.
 */
const ACCENT: Record<SceneId, { bloom: string; dot: string }> = {
  "social-pack": { bloom: "rgba(244,114,182,0.45)", dot: "#f472b6" }, // pink/rose
  cinematic: { bloom: "rgba(129,140,248,0.45)", dot: "#818cf8" }, // violet/indigo
  avatar: { bloom: "rgba(217,70,239,0.45)", dot: "#d946ef" }, // fuchsia/purple
  "brand-kit": { bloom: "rgba(251,146,60,0.42)", dot: "#fb923c" }, // amber/orange
  website: { bloom: "rgba(56,189,248,0.42)", dot: "#38bdf8" }, // sky/blue
  "short-form": { bloom: "rgba(45,212,191,0.42)", dot: "#2dd4bf" }, // emerald/teal
};

const ORDER: SceneId[] = [
  "social-pack",
  "cinematic",
  "avatar",
  "brand-kit",
  "website",
  "short-form",
];

/** Drifts its child a few px slower than the page as it scrolls past (rAF). */
function Parallax({
  children,
  className = "",
  amount = 26,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    let visible = false;

    const obs = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    obs.observe(el);

    const update = () => {
      frame = 0;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (just above) → 1 (just below), 0 when centered.
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(-progress * amount).toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [amount]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/** The faux studio input card: mono prompt that types once + Generiši button. */
function InputCard({
  prompt,
  ui,
  active,
}: {
  prompt: string;
  ui: Copy;
  active: boolean;
}) {
  const [typed, setTyped] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (!active || done.current) return;
    done.current = true;

    if (prefersReducedMotion()) {
      const raf = window.requestAnimationFrame(() => setTyped(prompt));
      return () => window.cancelAnimationFrame(raf);
    }

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(prompt.slice(0, i));
      if (i >= prompt.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [active, prompt]);

  const typing = typed.length < prompt.length;

  return (
    <div className="card w-full p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="eyebrow text-[0.7rem]">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden />
          {ui.inputLabel}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="mono min-h-[3.5rem] text-sm leading-relaxed text-zinc-200">
          {typed}
          <span
            className={`ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-violet-400 ${
              typing ? "motion-safe:animate-pulse" : "opacity-0"
            }`}
            aria-hidden
          />
        </p>
      </div>

      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="btn-primary mt-4 w-full"
      >
        {ui.generate}
        <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}

/** Animated gradient flow-line that draws once from input toward output. */
function FlowLine({
  active,
  vertical,
}: {
  active: boolean;
  vertical: boolean;
}) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (!active) return;
    // Either way the set happens inside the rAF callback (not synchronously),
    // which also gives the browser one frame to paint the un-drawn line first.
    const id = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(id);
  }, [active]);

  const len = 100;
  const stroke = {
    strokeDasharray: len,
    strokeDashoffset: drawn ? 0 : len,
    transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)",
  } as const;

  if (vertical) {
    return (
      <svg
        className="mx-auto h-12 w-6 lg:hidden"
        viewBox="0 0 24 48"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="flow-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="0.5" stopColor="#6366f1" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 V46"
          stroke="url(#flow-v)"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={len}
          style={stroke}
        />
      </svg>
    );
  }

  return (
    <svg
      className="hidden h-6 w-full lg:block"
      viewBox="0 0 200 24"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="flow-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path
        d="M2 12 H198"
        stroke="url(#flow-h)"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={len}
        style={stroke}
      />
    </svg>
  );
}

/** Renders the right module's REAL mock, counting the score up on short-form. */
function SceneMock({
  id,
  locale,
  active,
}: {
  id: SceneId;
  locale: Locale;
  active: boolean;
}) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (id !== "short-form" || !active) return;

    const target = 92;

    if (prefersReducedMotion()) {
      const raf = window.requestAnimationFrame(() => setScore(target));
      return () => window.cancelAnimationFrame(raf);
    }

    return animateValue({
      from: 0,
      to: target,
      duration: 1100,
      onUpdate: (v) => setScore(Math.round(v)),
    });
  }, [id, active]);

  switch (id) {
    case "social-pack":
      return <PostMock locale={locale} />;
    case "cinematic":
      return (
        <VideoMock
          src="/examples/cinematic.png"
          alt={locale === "sr" ? "Cinematic kadar" : "Cinematic frame"}
        />
      );
    case "avatar":
      return (
        <VerticalMock
          src="/examples/avatar.png"
          alt={locale === "sr" ? "Avatar voditelj" : "Avatar presenter"}
          caption={
            locale === "sr"
              ? "Predstavljamo novu sezonsku mešavinu ☕"
              : "Introducing our new seasonal blend ☕"
          }
          locale={locale}
        />
      );
    case "brand-kit":
      return <BrandMock locale={locale} />;
    case "website":
      return <BrowserMock locale={locale} />;
    case "short-form":
      return (
        <VerticalMock
          src="/examples/shortform.png"
          alt={locale === "sr" ? "Vertikalni klip" : "Vertical clip"}
          caption={
            locale === "sr"
              ? "Prvi kadar je kuka — ostani do kraja 🔥"
              : "The first frame is the hook — stay till the end 🔥"
          }
          score={score}
          locale={locale}
        />
      );
  }
}

function Scene({
  id,
  index,
  locale,
}: {
  id: SceneId;
  index: number;
  locale: Locale;
}) {
  const t = T[locale];
  const sc = t.scenes[id];
  const ui = t.ui;

  const ref = useRef<HTMLElement>(null);
  const bloomRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  // Input on the left for even rows, right for odd rows (alternating reel).
  const inputFirst = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          bloomRef.current?.classList.add("is-lit");
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const input = (
    <Reveal dir={inputFirst ? "left" : "right"} className="h-full">
      <InputCard prompt={sc.prompt} ui={ui} active={active} />
    </Reveal>
  );

  const output = (
    <Reveal dir={inputFirst ? "right" : "left"} delay={80}>
      <Parallax className="relative">
        <span
          ref={bloomRef}
          className="bloom"
          style={{ ["--bloom" as string]: ACCENT[id].bloom }}
          aria-hidden
        />
        <SceneMock id={id} locale={locale} active={active} />
      </Parallax>
    </Reveal>
  );

  return (
    <article ref={ref} aria-labelledby={`io-${id}`} className="scroll-mt-24">
      <div className="grid items-center gap-x-8 gap-y-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* Left column */}
        <div className={inputFirst ? "lg:order-1" : "lg:order-3"}>
          {inputFirst ? input : output}
        </div>

        {/* Connector */}
        <div className="lg:order-2 lg:w-24">
          <FlowLine active={active} vertical={false} />
          <FlowLine active={active} vertical />
        </div>

        {/* Right column */}
        <div className={inputFirst ? "lg:order-3" : "lg:order-1"}>
          {inputFirst ? output : input}
        </div>
      </div>

      {/* Honest pain → gain beneath the scene */}
      <Reveal dir="up" delay={120}>
        <div className="mx-auto mt-8 max-w-2xl space-y-4 text-center">
          <span className="eyebrow justify-center">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: ACCENT[id].dot }}
              aria-hidden
            />
            {sc.eyebrow}
          </span>
          <h3 id={`io-${id}`} className="text-2xl font-bold text-white sm:text-3xl">
            {sc.title}
          </h3>
          <ul className="mx-auto max-w-prose space-y-2.5 text-left">
            <li className="flex items-start gap-2.5">
              <X
                className="mt-1 h-4 w-4 shrink-0 text-zinc-500"
                strokeWidth={2.4}
                aria-hidden
              />
              <span className="text-zinc-500 line-through">{sc.pain}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-violet-300"
                strokeWidth={2.4}
                aria-hidden
              />
              <span className="text-lg text-zinc-100">{sc.gain}</span>
            </li>
          </ul>
          <div>
            <Link href={`/studio/${id}`} className="btn-ghost">
              {ui.try}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>
    </article>
  );
}

export default function InputOutput({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section
      aria-labelledby="input-output-heading"
      className="section relative"
    >
      <div className="mx-auto w-full max-w-5xl px-6">
        <Reveal dir="up" className="mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden />
            {t.eyebrow}
          </span>
          <h2
            id="input-output-heading"
            className="h2-fluid mt-4 text-white"
          >
            <span className="gradient-text">{t.heading}</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-pretty text-zinc-400">
            {t.sub}
          </p>
        </Reveal>

        <div className="mt-16 space-y-24">
          {ORDER.map((id, index) => (
            <Scene key={id} id={id} index={index} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
