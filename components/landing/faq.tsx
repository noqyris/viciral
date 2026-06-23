"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

type QA = {
  q: string;
  a: React.ReactNode;
};

const T = {
  sr: {
    eyebrow: "POŠTENO",
    titleA: "Pre nego što ",
    titleHi: "posumnjaš",
    titleB: ".",
    sub: "Pre-launch smo, pa razumemo skepsu. Evo iskrenih odgovora na ono što se stvarno pita.",
    items: [
      {
        q: "Da li su ovo pravi primeri?",
        a: (
          <>
            Da. Svaki primer na ovoj stranici je{" "}
            <span className="text-white">napravljen baš ovim alatom</span> — bez
            agencije, bez naknadne obrade. Ono što vidiš je ono što dobiješ.
          </>
        ),
      },
      {
        q: "Šta je 200 kredita?",
        a: (
          <>
            Krediti su način da platiš samo ono što napraviš.{" "}
            <span className="mono text-white">1 kredit = $0.01</span>, pa je 200
            kredita dovoljno da{" "}
            <span className="text-white">probaš više modula</span> i vidiš kako
            radi pre nego što bilo šta platiš.
          </>
        ),
      },
      {
        q: "Koje modele koristite?",
        a: (
          <>
            Prave, komercijalne modele:{" "}
            <span className="mono text-white">
              Claude, Nano Banana / Gemini, Seedance, Whisper
            </span>{" "}
            i <span className="mono text-white">Recraft</span>. Viciral ih
            orkestrira na jednom mestu — ti ne biraš model, dobiješ rezultat.
          </>
        ),
      },
      {
        q: "Da li mi treba kartica?",
        a: (
          <>
            Ne. Start je <span className="text-white">bez kartice</span> —
            napraviš nalog, dobiješ 200 kredita i odmah probaš. Karticu dodaješ
            tek ako i kad poželiš još.
          </>
        ),
      },
      {
        q: "Da li je sve već dostupno?",
        a: (
          <>
            Većina jeste i radi danas. Moduli koji još stižu jasno su označeni sa{" "}
            <span className="mono text-white">„uskoro&#8221;</span> — ništa ne
            obećavamo što ne možeš da uradiš sada.
          </>
        ),
      },
    ] satisfies QA[],
    ctaText: "Još pitanja? Probaj besplatno →",
  },
  en: {
    eyebrow: "HONEST",
    titleA: "Before you ",
    titleHi: "doubt it",
    titleB: ".",
    sub: "We're pre-launch, so we get the skepticism. Here are honest answers to what people actually ask.",
    items: [
      {
        q: "Are these real examples?",
        a: (
          <>
            Yes. Every example on this page was{" "}
            <span className="text-white">made with this very tool</span> — no
            agency, no touch-ups after the fact. What you see is what you get.
          </>
        ),
      },
      {
        q: "What are 200 credits?",
        a: (
          <>
            Credits are how you pay only for what you make.{" "}
            <span className="mono text-white">1 credit = $0.01</span>, so 200
            credits is enough to{" "}
            <span className="text-white">try several modules</span> and see how it
            works before you pay anything.
          </>
        ),
      },
      {
        q: "Which models do you use?",
        a: (
          <>
            Real, commercial models:{" "}
            <span className="mono text-white">
              Claude, Nano Banana / Gemini, Seedance, Whisper
            </span>{" "}
            and <span className="mono text-white">Recraft</span>. Viciral
            orchestrates them in one place — you don&apos;t pick a model, you get a
            result.
          </>
        ),
      },
      {
        q: "Do I need a card?",
        a: (
          <>
            No. Getting started is <span className="text-white">card-free</span> —
            create an account, get 200 credits and try it right away. You only add
            a card if and when you want more.
          </>
        ),
      },
      {
        q: "Is everything already available?",
        a: (
          <>
            Most of it is, and works today. Modules still on the way are clearly
            marked <span className="mono text-white">&ldquo;soon&rdquo;</span> — we
            don&apos;t promise anything you can&apos;t do right now.
          </>
        ),
      },
    ] satisfies QA[],
    ctaText: "More questions? Try it free →",
  },
} as const;

export default function Faq({ locale }: { locale: Locale }) {
  const t = T[locale];
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="section relative mx-auto w-full max-w-3xl px-5 sm:px-6"
    >
      <Reveal dir="up">
        <p className="eyebrow">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-violet-400"
          />
          {t.eyebrow}
        </p>
        <h2
          id={`${baseId}-heading`}
          className="h2-fluid mt-4 text-[#e7e7ea]"
        >
          {t.titleA}
          <span className="gradient-text">{t.titleHi}</span>
          {t.titleB}
        </h2>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-pretty text-zinc-400">
          {t.sub}
        </p>
      </Reveal>

      <ul className="mt-10 flex flex-col gap-3">
        {t.items.map((item, i) => {
          const isOpen = open === i;
          const btnId = `${baseId}-btn-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <li key={item.q}>
              <Reveal dir="up" delay={i * 70} className="card block overflow-hidden rounded-2xl">
                <h3 className="m-0">
                  <button
                    type="button"
                    id={btnId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <span className="text-lg font-semibold text-[#e7e7ea]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-violet-300 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                    >
                      <Plus className="size-4" strokeWidth={2} />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className="px-5 pb-5 sm:px-6"
                >
                  <p className="max-w-prose text-base leading-relaxed text-pretty text-zinc-400">
                    {item.a}
                  </p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <Reveal dir="up" delay={120}>
        <div className="mt-10">
          <Link href="/signup" className="btn-primary">
            {t.ctaText}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
