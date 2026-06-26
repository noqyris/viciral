import Link from "next/link";
import { Zap } from "lucide-react";
import { MODULES } from "@/lib/modules/registry";
import { ModuleIcon } from "@/components/icons";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { getLocale } from "@/lib/i18n-server";
import { moduleName, moduleTagline, CATEGORY_LABEL } from "@/lib/modules/i18n";

const CAT_GRAD: Record<string, string> = {
  social: "from-pink-500 to-rose-500",
  video: "from-violet-500 to-indigo-500",
  brand: "from-amber-500 to-orange-500",
  web: "from-emerald-500 to-teal-500",
  image: "from-sky-500 to-blue-500",
  audio: "from-fuchsia-500 to-purple-500",
};

const T = {
  sr: {
    eyebrow: "Studio",
    titleA: "Napravi ",
    titleHi: "nešto",
    sub: "Izaberi modul — više AI modela radi zajedno. Cenu u kreditima vidiš pre pokretanja.",
    auto: "Auto",
    soon: "Uskoro",
    from: "od ≈",
    credits: "kredita",
  },
  en: {
    eyebrow: "Studio",
    titleA: "Make ",
    titleHi: "something",
    sub: "Pick a module — multiple AI models working together. You see the credit cost before running.",
    auto: "Auto",
    soon: "Soon",
    from: "from ≈",
    credits: "credits",
  },
} as const;

export default async function StudioHub() {
  const locale = await getLocale();
  const t = T[locale];

  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      {/* Ambient top glow so the studio reads "lit", like the landing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(75%_100%_at_50%_0%,rgba(99,102,241,0.14),transparent_70%)]"
      />
      <header className="relative mb-10">
        <p className="eyebrow">
          <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
          {t.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
          {t.titleA}
          <span className="gradient-text">{t.titleHi}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-400">{t.sub}</p>
      </header>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const available = m.status === "available";
          const estimate = estimateModuleCredits(m.slug);
          const grad = CAT_GRAD[m.category] ?? "from-zinc-600 to-zinc-700";
          const catLabel = CATEGORY_LABEL[m.category]?.[locale] ?? m.category;

          const inner = (
            <div
              className={`group relative flex h-full flex-col rounded-2xl p-5 transition-all duration-200 ${
                available
                  ? "card card-frost hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_24px_70px_-36px_rgba(139,92,246,0.7)]"
                  : "border border-dashed border-white/10 bg-white/[0.02] opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${grad} shadow-lg`}
                >
                  <ModuleIcon slug={m.slug} className="h-[22px] w-[22px] text-white" strokeWidth={2} />
                </span>
                <div className="flex items-center gap-1.5">
                  {available && m.supportsAuto && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-400/20">
                      <Zap className="h-3 w-3 fill-violet-300" strokeWidth={0} aria-hidden />
                      {t.auto}
                    </span>
                  )}
                  {!available && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-zinc-400">
                      {t.soon}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 font-semibold text-zinc-100">
                {moduleName(m.slug, locale, m.name)}
              </div>
              <p className="mt-1 flex-1 text-sm text-zinc-400">
                {moduleTagline(m.slug, locale, m.tagline)}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                <span className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-zinc-400">
                  {catLabel}
                </span>
                {available && estimate > 0 && (
                  <span className="text-zinc-500">
                    {t.from} {estimate} {t.credits}
                  </span>
                )}
              </div>
            </div>
          );

          return available ? (
            <Link key={m.slug} href={`/studio/${m.slug}`}>
              {inner}
            </Link>
          ) : (
            <div key={m.slug} aria-disabled>
              {inner}
            </div>
          );
        })}
      </div>
    </main>
  );
}
