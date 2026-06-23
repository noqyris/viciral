import { Cpu } from "lucide-react";

import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "POD HAUBOM",
    heading: "Pravi modeli, jedan nalog",
    sub: "Svaki zadatak ide modelu koji ga radi najbolje — a ti ostaješ na jednom nalogu, bez žongliranja sa pet aplikacija.",
    engines: [
      { name: "Claude", role: "tekst / strategija" },
      { name: "Nano Banana", role: "Gemini · slike" },
      { name: "Seedance", role: "video" },
      { name: "Whisper", role: "transkript / titlovi" },
      { name: "Recraft", role: "vektor / logo" },
    ],
  },
  en: {
    eyebrow: "UNDER THE HOOD",
    heading: "Real models, one account",
    sub: "Each task goes to the model that does it best — while you stay on one account, no juggling five apps.",
    engines: [
      { name: "Claude", role: "text / strategy" },
      { name: "Nano Banana", role: "Gemini · images" },
      { name: "Seedance", role: "video" },
      { name: "Whisper", role: "transcript / captions" },
      { name: "Recraft", role: "vector / logo" },
    ],
  },
} as const;

export default function ModelRig({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section aria-labelledby="model-rig-heading" className="section section-pit">
      <div className="mx-auto w-full max-w-5xl px-6">
        <Reveal dir="up" className="flex justify-center">
          <p className="eyebrow">
            <Cpu aria-hidden="true" className="h-3.5 w-3.5" />
            {t.eyebrow}
          </p>
        </Reveal>

        <Reveal dir="up" delay={60}>
          <h2
            id="model-rig-heading"
            className="mt-4 text-center text-2xl font-bold text-white sm:text-3xl"
          >
            {t.heading}
          </h2>
        </Reveal>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {t.engines.map((engine, i) => (
            <li key={engine.name}>
              <Reveal dir="up" delay={120 + i * 60}>
                <span className="chip">
                  <span className="font-semibold text-white">{engine.name}</span>
                  <span aria-hidden="true" className="text-zinc-600">
                    ·
                  </span>
                  <span className="text-zinc-400">{engine.role}</span>
                </span>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal dir="up" delay={120 + t.engines.length * 60}>
          <p className="mono mx-auto mt-7 max-w-xl text-center text-sm leading-relaxed text-zinc-500">
            {t.sub}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
