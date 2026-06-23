import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { PostMock, VerticalMock, BrandMock } from "@/components/landing-mocks";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "Svetla se pale",
    ctaTitleA: "Spreman da ",
    ctaTitleHi: "probaš",
    ctaTitleB: "?",
    ctaSub: "200 besplatnih kredita. Bez kartice.",
    createAccount: "Napravi nalog →",
    chipCredits: "200 kredita",
    chipNoCard: "bez kartice",
    chipMade: "napravljeno ovim alatom",
    repriseLabel: "Pravi radovi napravljeni ovim alatom",
    shortAlt: "Primer vertikalnog klipa napravljen ovim alatom",
    shortCaption: "Spremno za reels",
  },
  en: {
    eyebrow: "The lights come up",
    ctaTitleA: "Ready to ",
    ctaTitleHi: "try it",
    ctaTitleB: "?",
    ctaSub: "200 free credits. No card needed.",
    createAccount: "Create account →",
    chipCredits: "200 credits",
    chipNoCard: "no card",
    chipMade: "made with this tool",
    repriseLabel: "Real work made with this tool",
    shortAlt: "Vertical clip example made with this tool",
    shortCaption: "Ready for reels",
  },
} as const;

export default function FinalCta({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="section section-pit relative isolate overflow-hidden"
    >
      {/* Intensified aurora reprise — a brighter breathing radial glow that
          freezes under prefers-reduced-motion (pure CSS). */}
      <div
        aria-hidden
        className="cta-breathe pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[140%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(139,92,246,0.28),rgba(99,102,241,0.14)_45%,transparent_72%)]"
      />

      {/* Faint, low-opacity reprise of the hero floating cards so the reel never
          fully ends. Decorative only and hidden from assistive tech. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <span aria-label={t.repriseLabel} className="sr-only" role="img" />
        <div className="relative mx-auto h-full max-w-6xl">
          <div className="absolute -left-6 top-10 hidden w-[22%] max-w-[15rem] -rotate-6 opacity-[0.16] blur-[1px] lg:block">
            <div className="float" style={{ ["--dur" as string]: "9s", ["--amp" as string]: "8px" }}>
              <BrandMock locale={locale} />
            </div>
          </div>
          <div className="absolute -right-2 top-6 hidden w-[16%] max-w-[11rem] rotate-6 opacity-[0.16] blur-[1px] lg:block">
            <div className="float" style={{ ["--dur" as string]: "8s", ["--amp" as string]: "11px" }}>
              <VerticalMock
                src="/examples/shortform.png"
                alt={t.shortAlt}
                caption={t.shortCaption}
                locale={locale}
              />
            </div>
          </div>
          <div className="absolute bottom-4 right-10 hidden w-[20%] max-w-[14rem] -rotate-3 opacity-[0.12] blur-[1px] xl:block">
            <div className="float" style={{ ["--dur" as string]: "10s", ["--amp" as string]: "7px" }}>
              <PostMock locale={locale} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal dir="up">
          <p className="eyebrow justify-center">
            <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
            {t.eyebrow}
          </p>
        </Reveal>

        <Reveal dir="up" delay={80}>
          <h2 id="final-cta-heading" className="display mt-5 text-white">
            {t.ctaTitleA}
            <span className="gradient-text">{t.ctaTitleHi}</span>
            {t.ctaTitleB}
          </h2>
        </Reveal>

        <Reveal dir="up" delay={160}>
          <p className="mono mx-auto mt-6 max-w-xl text-lg text-zinc-300">
            {t.ctaSub}
          </p>
        </Reveal>

        <Reveal dir="up" delay={240}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/signup"
              className="btn-primary w-full px-8 py-4 text-base sm:w-auto"
            >
              {t.createAccount}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </Reveal>

        <Reveal dir="up" delay={320}>
          <ul className="mono mt-7 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[13px] text-zinc-500">
            <li>{t.chipCredits}</li>
            <li aria-hidden className="text-zinc-700">
              ·
            </li>
            <li>{t.chipNoCard}</li>
            <li aria-hidden className="text-zinc-700">
              ·
            </li>
            <li className="text-violet-300/90">{t.chipMade}</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
