import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

type Item = {
  name: string;
  w: number;
  h: number;
  slug: string;
  label: { sr: string; en: string };
};

const ITEMS: Item[] = [
  { name: "food", w: 1344, h: 768, slug: "cinematic", label: { sr: "Restoran", en: "Food" } },
  { name: "skincare", w: 1024, h: 1024, slug: "social-pack", label: { sr: "Kozmetika", en: "Skincare" } },
  { name: "fashion", w: 768, h: 1344, slug: "social-pack", label: { sr: "Moda", en: "Fashion" } },
  { name: "saas", w: 1344, h: 768, slug: "website", label: { sr: "SaaS", en: "SaaS" } },
  { name: "realestate", w: 1344, h: 768, slug: "website", label: { sr: "Nekretnine", en: "Real estate" } },
  { name: "fitness", w: 768, h: 1344, slug: "short-form", label: { sr: "Fitnes", en: "Fitness" } },
];

const T = {
  sr: {
    eyebrow: "INDUSTRIJE",
    headA: "Jedan studio, ",
    headHi: "svaka industrija",
    headB: ".",
    sub: "Od kozmetike do nekretnina — isti alat, tvoj brend. Pređi mišem preko slike za sirov „pre“.",
    before: "PRE",
    make: "Napravi",
  },
  en: {
    eyebrow: "INDUSTRIES",
    headA: "One studio, ",
    headHi: "every industry",
    headB: ".",
    sub: "From skincare to real estate — one tool, your brand. Hover an image for the raw “before”.",
    before: "RAW",
    make: "Make",
  },
} as const;

export default function Industries({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section id="industries" aria-labelledby="industries-heading" className="section relative scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal dir="up">
          <p className="eyebrow">
            <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
            {t.eyebrow}
          </p>
          <h2 id="industries-heading" className="h2-fluid mt-4 max-w-3xl text-white">
            {t.headA}
            <span className="gradient-text">{t.headHi}</span>
            {t.headB}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400">{t.sub}</p>
        </Reveal>

        {/* Masonry — mixed aspect ratios flow cleanly into columns */}
        <div className="mt-12 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {ITEMS.map((it, i) => (
            <div key={it.name} data-fx="assemble" data-i={i} className="mb-5 block break-inside-avoid">
              <figure className="ba-card group relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_90px_-55px_rgba(139,92,246,0.7)]">
                {/* AFTER (base) */}
                <Image
                  src={`/examples/${it.name}.png`}
                  alt={t.make + " — " + it.label[locale]}
                  width={it.w}
                  height={it.h}
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 44vw, 90vw"
                  className="h-auto w-full"
                />
                {/* BEFORE (raw) — crossfades in on hover/focus */}
                <Image
                  src={`/examples/${it.name}-before.png`}
                  alt=""
                  aria-hidden
                  width={it.w}
                  height={it.h}
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 44vw, 90vw"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                />
                <span className="chip absolute right-3 top-3 z-10 text-zinc-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                  {t.before}
                </span>

                {/* Label + link */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-sm font-semibold text-white drop-shadow">{it.label[locale]}</span>
                    <Link
                      href={`/studio/${it.slug}`}
                      className="pointer-events-auto mono inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                      {t.make}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
