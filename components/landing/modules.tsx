import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ModuleIcon } from "@/components/icons";
import { MODULES } from "@/lib/modules/registry";
import { moduleName, moduleTagline, CATEGORY_LABEL } from "@/lib/modules/i18n";
import type { Locale } from "@/lib/i18n";

/**
 * "The full rig" — every module rendered as one lit control surface so the
 * product's breadth reads as a single system, not a scattered feature list.
 *
 * Server component: pure markup + CSS. The only motion is the existing
 * <Reveal> scroll-in stagger and the pure-CSS .card-glow hover lift/bloom.
 */

const T = {
  sr: {
    eyebrow: "Svih 10 modula",
    title: (n: number) => `Svih ${n} modula na jednom mestu`,
    sub: "Jedan studio, jedna prijava. Svaki modul je gotov tok koji spaja prave modele — kreni od bilo kog.",
    flagship: "Flagship",
    soon: "Uskoro",
    open: "Otvori modul",
  },
  en: {
    eyebrow: "All 10 modules",
    title: (n: number) => `All ${n} modules in one place`,
    sub: "One studio, one login. Each module is a finished workflow that wires real models together — start from any of them.",
    flagship: "Flagship",
    soon: "Soon",
    open: "Open module",
  },
} as const;

export default function Modules({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section
      id="modules"
      aria-labelledby="modules-heading"
      className="section mx-auto w-full max-w-6xl scroll-mt-24 px-6"
    >
      <Reveal dir="up">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mx-auto w-fit">
            <span aria-hidden className="text-violet-400">
              &bull;
            </span>
            {t.eyebrow}
          </p>
          <h2
            id="modules-heading"
            className="h2-fluid mt-4 text-balance font-bold text-white"
          >
            {t.title(MODULES.length)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400">
            {t.sub}
          </p>
        </div>
      </Reveal>

      <ul
        role="list"
        className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
      >
        {MODULES.map((m, i) => {
          const isFlagship = m.slug === "social-pack";
          const isSoon = m.status === "soon";
          const category = CATEGORY_LABEL[m.category]?.[locale] ?? m.category;

          return (
            <li key={m.slug} className="flex">
              <Reveal dir="up" delay={(i % 5) * 60} className="flex w-full">
                <Link
                  href={`/studio/${m.slug}`}
                  className="card-glow group flex h-full w-full flex-col gap-3 rounded-2xl p-4"
                  aria-label={`${t.open}: ${moduleName(m.slug, locale, m.name)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-white/10 transition-colors group-hover:ring-violet-400/40">
                      <ModuleIcon
                        slug={m.slug}
                        className="h-[18px] w-[18px] text-violet-300"
                      />
                    </span>
                    {isFlagship ? (
                      <span className="mono text-[10px] uppercase tracking-[0.16em] text-violet-300/90">
                        {t.flagship}
                      </span>
                    ) : isSoon ? (
                      <span className="mono rounded-md border border-dashed border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                        {t.soon}
                      </span>
                    ) : (
                      <ArrowUpRight
                        aria-hidden
                        className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-violet-300"
                        strokeWidth={1.75}
                      />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold leading-snug text-white">
                    {moduleName(m.slug, locale, m.name)}
                  </h3>

                  <p className="text-[13px] leading-relaxed text-pretty text-zinc-400">
                    {moduleTagline(m.slug, locale, m.tagline)}
                  </p>

                  <div className="mt-auto flex pt-1">
                    <span className="chip mono ml-auto text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                      {category}
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
