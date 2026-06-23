import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "Cena truda",
    heading: "Isti posao, ",
    headingAccent: "bez nedelja i bez agencije",
    sub: "Bez izmišljenih brojki i tuđih cena — samo iskreno poređenje truda i vremena.",
    cols: {
      alone: {
        tag: "Sam",
        title: "Sve sam, na više mesta",
        rows: [
          "Mnogo aplikacija i naloga",
          "Sati po jednoj objavi",
          "Nedosledan stil i brend",
          "Sve počinje iznova svaki put",
        ],
      },
      agency: {
        tag: "Agencija",
        title: "Predaš drugima",
        rows: [
          "Nedelje do prvog rezultata",
          "Skupo i po projektu",
          "Čekaš tuđe rokove",
          "Svaka izmena traži novi krug",
        ],
      },
      viciral: {
        tag: "Viciral",
        title: "Jedan studio, tvoj brend",
        rows: [
          "Jedan alat umesto deset",
          "Minuti do gotovog seta",
          "Brend-konzistentno svaki put",
          "200 kredita za start, bez kartice",
        ],
      },
    },
    cta: "Počni besplatno",
    ctaSub: "200 kredita · bez kartice",
  },
  en: {
    eyebrow: "The cost of effort",
    heading: "Same work, ",
    headingAccent: "without the weeks or the agency",
    sub: "No invented numbers, no competitor prices — just an honest comparison of effort and time.",
    cols: {
      alone: {
        tag: "Alone",
        title: "Everything yourself, everywhere",
        rows: [
          "Many apps and accounts",
          "Hours per single post",
          "Inconsistent style and brand",
          "Starting from scratch every time",
        ],
      },
      agency: {
        tag: "Agency",
        title: "Hand it off to others",
        rows: [
          "Weeks to a first result",
          "Expensive, billed per project",
          "Waiting on someone else's schedule",
          "Every edit means another round",
        ],
      },
      viciral: {
        tag: "Viciral",
        title: "One studio, your brand",
        rows: [
          "One tool instead of ten",
          "Minutes to a finished set",
          "Brand-consistent every time",
          "200 credits to start, no card",
        ],
      },
    },
    cta: "Start for free",
    ctaSub: "200 credits · no card",
  },
} as const;

export default function WhyDifferent({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section
      id="cena-truda"
      aria-labelledby="why-different-heading"
      className="relative w-full scroll-mt-24"
    >
      <div className="section mx-auto max-w-5xl px-5 sm:px-6">
        <Reveal dir="up">
          <div className="max-w-2xl">
            <p className="eyebrow">
              <span aria-hidden="true">◆</span>
              {t.eyebrow}
            </p>
            <h2
              id="why-different-heading"
              className="h2-fluid mt-4 text-white"
            >
              {t.heading}
              <span className="gradient-text">{t.headingAccent}</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-pretty text-zinc-400">
              {t.sub}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:mt-14 md:grid-cols-3">
          {/* Alone — dim cost column */}
          <Reveal dir="up" delay={0}>
            <CostColumn
              tag={t.cols.alone.tag}
              title={t.cols.alone.title}
              rows={t.cols.alone.rows}
            />
          </Reveal>

          {/* Agency — dim cost column */}
          <Reveal dir="up" delay={70}>
            <CostColumn
              tag={t.cols.agency.tag}
              title={t.cols.agency.title}
              rows={t.cols.agency.rows}
            />
          </Reveal>

          {/* Viciral — the lit, winning column */}
          <Reveal dir="up" delay={140}>
            <ViciralColumn
              tag={t.cols.viciral.tag}
              title={t.cols.viciral.title}
              rows={t.cols.viciral.rows}
              cta={t.cta}
              ctaSub={t.ctaSub}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CostColumn({
  tag,
  title,
  rows,
}: {
  tag: string;
  title: string;
  rows: readonly string[];
}) {
  return (
    <div className="card flex h-full flex-col p-6">
      <span className="chip self-start">{tag}</span>
      <h3 className="mt-4 text-2xl font-bold text-zinc-300">{title}</h3>
      <ul className="mt-5 flex flex-1 flex-col gap-3">
        {rows.map((row) => (
          <li key={row} className="flex items-start gap-3">
            <X
              aria-hidden="true"
              strokeWidth={2.5}
              className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
            />
            <span className="text-[0.95rem] leading-relaxed text-zinc-500">
              {row}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViciralColumn({
  tag,
  title,
  rows,
  cta,
  ctaSub,
}: {
  tag: string;
  title: string;
  rows: readonly string[];
  cta: string;
  ctaSub: string;
}) {
  return (
    <div className="relative h-full">
      {/* violet bloom behind the lit column */}
      <div
        aria-hidden="true"
        className="bloom is-lit"
        style={{ "--bloom": "rgba(139, 92, 246, 0.5)" } as React.CSSProperties}
      />
      {/* gradient hairline border via padding wrapper */}
      <div className="h-full rounded-2xl bg-gradient-to-br from-violet-500/60 via-indigo-500/40 to-sky-400/50 p-px">
        <div className="card-glow flex h-full flex-col rounded-2xl p-6">
          <span className="chip self-start border-violet-400/40 text-white">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-violet-300" />
            {tag}
          </span>
          <h3 className="mt-4 text-2xl font-bold text-white">{title}</h3>
          <ul className="mt-5 flex flex-1 flex-col gap-3">
            {rows.map((row) => (
              <li key={row} className="flex items-start gap-3">
                <Check
                  aria-hidden="true"
                  strokeWidth={2.75}
                  className="mt-0.5 h-4 w-4 shrink-0 text-violet-400"
                />
                <span className="text-[0.95rem] leading-relaxed text-zinc-200">
                  {row}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/signup" className="btn-primary mt-6 w-full">
            {cta}
          </Link>
          <p className="mono mt-3 text-center text-xs text-zinc-500">
            {ctaSub}
          </p>
        </div>
      </div>
    </div>
  );
}
