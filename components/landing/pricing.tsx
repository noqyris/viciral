import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "CENA",
    heading: "Počni besplatno.",
    headingAccent: "Plati samo kad rasteš.",
    sub: "200 kredita su tvoji odmah, bez kartice. Paketi su tu kad ti zatreba više — cene objavljujemo iskreno, bez fine štampe.",
    free: {
      badge: "AKTIVNO",
      name: "Besplatno",
      price: "200 kredita",
      priceNote: "bez kartice",
      blurb: "Dovoljno da napraviš prve prave radove i vidiš kako alat radi.",
      features: [
        "Pristup svim modulima — od social paketa do videa",
        "Pravi modeli: Claude, Nano Banana, Seedance, Whisper",
        "Tvoji izvozi u punoj rezoluciji",
        "Bez probnog perioda na sat — krediti ne ističu naglo",
      ],
      cta: "Počni besplatno → 200 kredita",
    },
    creator: {
      badge: "USKORO",
      name: "Creator",
      blurb: "Za redovan ritam objava i kraće video forme.",
      features: [
        "Više kredita mesečno",
        "Brend memorija — ton i vizuelni stil se pamte",
        "Brži red za generisanje",
      ],
      cta: "Obavesti me",
    },
    studio: {
      badge: "USKORO",
      name: "Studio",
      blurb: "Za timove i veći obim cinematic i avatar produkcije.",
      features: [
        "Najviše kredita + dokupljivanje po potrebi",
        "Više brend profila i radnih prostora",
        "Prioritet i napredni izvozi",
      ],
      cta: "Obavesti me",
    },
    indicative: "indikativno",
    footnote: "1 kredit = $0.01 · plaćaš samo modele koje pokreneš.",
  },
  en: {
    eyebrow: "PRICING",
    heading: "Start free.",
    headingAccent: "Pay only as you grow.",
    sub: "200 credits are yours right now, no card. Plans show up when you need more — priced honestly, no fine print.",
    free: {
      badge: "ACTIVE",
      name: "Free",
      price: "200 credits",
      priceNote: "no card",
      blurb: "Enough to make your first real work and see how the tool runs.",
      features: [
        "Access to every module — from social packs to video",
        "Real models: Claude, Nano Banana, Seedance, Whisper",
        "Your exports at full resolution",
        "No one-hour trial — credits don't expire on you",
      ],
      cta: "Start free → 200 credits",
    },
    creator: {
      badge: "SOON",
      name: "Creator",
      blurb: "For a steady posting rhythm and short-form video.",
      features: [
        "More credits each month",
        "Brand memory — your tone and visual style stick",
        "Faster generation queue",
      ],
      cta: "Notify me",
    },
    studio: {
      badge: "SOON",
      name: "Studio",
      blurb: "For teams and higher-volume cinematic and avatar work.",
      features: [
        "Most credits + top-ups when you need them",
        "Multiple brand profiles and workspaces",
        "Priority and advanced exports",
      ],
      cta: "Notify me",
    },
    indicative: "indicative",
    footnote: "1 credit = $0.01 · you only pay for the models you run.",
  },
} as const;

export default function Pricing({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="section"
    >
      <div className="mx-auto max-w-5xl px-6">
        <Reveal dir="up">
          <p className="eyebrow">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-violet-400" />
            {t.eyebrow}
          </p>
          <h2 id="pricing-heading" className="h2-fluid mt-4 text-white">
            {t.heading}{" "}
            <span className="gradient-text">{t.headingAccent}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400">
            {t.sub}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:items-stretch">
          {/* FREE — the lit, primary tier */}
          <Reveal dir="up" delay={60} className="md:order-1 h-full">
            <article className="card-glow relative flex h-full flex-col p-6 sm:p-7">
              <div
                aria-hidden="true"
                className="bloom is-lit"
                style={{ "--bloom": "rgba(139, 92, 246, 0.4)" } as React.CSSProperties}
              />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-bold text-white">{t.free.name}</h3>
                <span className="chip text-emerald-300">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
                  {t.free.badge}
                </span>
              </div>

              <div className="mt-5">
                <p className="display text-4xl font-bold tracking-tight text-white sm:text-4xl">
                  {t.free.price}
                </p>
                <p className="mono mt-1 text-sm text-zinc-400">{t.free.priceNote}</p>
              </div>

              <p className="mt-4 text-base leading-relaxed text-pretty text-zinc-400">
                {t.free.blurb}
              </p>

              <ul className="mt-6 flex flex-col gap-3">
                {t.free.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      aria-hidden="true"
                      strokeWidth={2.5}
                      className="mt-0.5 size-4 shrink-0 text-violet-300"
                    />
                    <span className="text-sm leading-relaxed text-zinc-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="btn-primary mt-7 w-full"
                aria-label={t.free.cta}
              >
                <Sparkles aria-hidden="true" className="size-4" />
                {t.free.cta}
              </Link>
            </article>
          </Reveal>

          {/* CREATOR — honest, indicative */}
          <Reveal dir="up" delay={140} className="md:order-2 h-full">
            <PaidTier tier={t.creator} indicative={t.indicative} />
          </Reveal>

          {/* STUDIO — honest, indicative */}
          <Reveal dir="up" delay={220} className="md:order-3 h-full">
            <PaidTier tier={t.studio} indicative={t.indicative} />
          </Reveal>
        </div>

        <Reveal dir="up" delay={280}>
          <p className="mono mt-8 text-center text-sm text-zinc-500">{t.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}

function PaidTier({
  tier,
  indicative,
}: {
  tier: {
    badge: string;
    name: string;
    blurb: string;
    features: readonly string[];
    cta: string;
  };
  indicative: string;
}) {
  return (
    <article className="card flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
        <span className="chip">{tier.badge}</span>
      </div>

      <div className="mt-5">
        <p className="mono inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300">
          {indicative}
        </p>
      </div>

      <p className="mt-4 text-base leading-relaxed text-pretty text-zinc-400">{tier.blurb}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              aria-hidden="true"
              strokeWidth={2.5}
              className="mt-0.5 size-4 shrink-0 text-zinc-500"
            />
            <span className="text-sm leading-relaxed text-zinc-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled
        aria-disabled="true"
        className="btn-ghost mt-7 w-full cursor-not-allowed opacity-60"
      >
        {tier.cta}
      </button>
    </article>
  );
}
