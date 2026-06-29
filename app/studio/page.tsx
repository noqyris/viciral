import Link from "next/link";
import { Sparkles, Globe, Smartphone, Hexagon, ArrowRight, Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getActiveOrg } from "@/lib/active-org";
import { colorsToStrings } from "@/lib/brand/inject";
import { getLocale } from "@/lib/i18n-server";

const BUILDERS = [
  { id: "content", href: "/studio/content", icon: Sparkles, grad: "from-pink-500 to-rose-500" },
  { id: "web", href: "/studio/website", icon: Globe, grad: "from-emerald-500 to-teal-500" },
  { id: "app", href: "/studio/app-builder", icon: Smartphone, grad: "from-sky-500 to-blue-500" },
  { id: "logo", href: "/studio/logo", icon: Hexagon, grad: "from-amber-500 to-orange-500" },
] as const;

const T = {
  sr: {
    eyebrow: "Brend workspace",
    titleA: "Pravi za ",
    sub: "Sve usluge za tvoj brend — jedan identitet u svemu što napraviš.",
    identity: "Identitet brenda",
    editBrand: "Uredi brend →",
    noVoice: "Ton glasa nije postavljen.",
    defineTitle: "Definiši svoj brend",
    defineSub:
      "Boje, glas i logo se ubacuju u SVAKU generaciju (look-alike). Postavi ih, ili pusti Brand Kit da ih napravi, pre nego što kreneš.",
    defineCta: "Podesi brend",
    brandKit: "Brand Kit (auto)",
    builders: {
      content: { name: "Content creation", tag: "Slike, video i objave — u stilu brenda." },
      web: { name: "Web builder", tag: "Responsive sajt iz opisa brenda." },
      app: { name: "App builder", tag: "Interaktivna multi-screen aplikacija." },
      logo: { name: "Logo builder", tag: "SVG logo varijante u bojama brenda." },
    } as Record<string, { name: string; tag: string }>,
  },
  en: {
    eyebrow: "Brand workspace",
    titleA: "Build for ",
    sub: "Every service for your brand — one identity across everything you make.",
    identity: "Brand identity",
    editBrand: "Edit brand →",
    noVoice: "No tone of voice set yet.",
    defineTitle: "Define your brand",
    defineSub:
      "Colors, voice and logo are injected into EVERY generation (look-alike). Set them, or let Brand Kit make them, before you start.",
    defineCta: "Set up brand",
    brandKit: "Brand Kit (auto)",
    builders: {
      content: { name: "Content creation", tag: "Images, video and posts — in your brand style." },
      web: { name: "Web builder", tag: "Responsive site from a brand description." },
      app: { name: "App builder", tag: "Interactive multi-screen app." },
      logo: { name: "Logo builder", tag: "SVG logo variants in your brand colors." },
    } as Record<string, { name: string; tag: string }>,
  },
} as const;

export default async function StudioHub() {
  const locale = await getLocale();
  const t = T[locale];
  const user = await getCurrentUser();
  const org = await getActiveOrg(user.id);
  const colors = colorsToStrings(org.colors);
  const hasIdentity = Boolean(org.voice?.trim() || colors.length || org.logoUrl);

  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(75%_100%_at_50%_0%,rgba(99,102,241,0.14),transparent_70%)]"
      />
      <header className="relative mb-8">
        <p className="eyebrow">
          <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
          {t.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
          {t.titleA}
          <span className="gradient-text">{org.name}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-400">{t.sub}</p>
      </header>

      {/* Brand identity at a glance — the source of the universal context */}
      {hasIdentity ? (
        <div className="card card-frost relative mb-8 flex flex-wrap items-center gap-4 rounded-2xl p-5">
          {org.logoUrl ? (
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={org.logoUrl} alt="" className="max-h-full max-w-full object-contain p-1.5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{t.identity}</p>
            <p className="mt-0.5 truncate text-sm text-zinc-300">{org.voice?.trim() || t.noVoice}</p>
            {colors.length > 0 && (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <span key={c} title={c} className="size-5 rounded-md ring-1 ring-inset ring-white/15" style={{ backgroundColor: c }} />
                ))}
              </span>
            )}
          </div>
          <Link href="/studio/brand" className="shrink-0 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200">
            {t.editBrand}
          </Link>
        </div>
      ) : (
        <div className="card card-frost relative mb-8 flex flex-col gap-4 rounded-2xl border-violet-400/20 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/30">
              <Wand2 className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-white">{t.defineTitle}</p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-400">{t.defineSub}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/studio/brand-kit" className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-400/40">
              {t.brandKit}
            </Link>
            <Link href="/studio/brand" className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 px-3.5 py-2 text-sm font-semibold text-white">
              {t.defineCta}
            </Link>
          </div>
        </div>
      )}

      {/* The builders */}
      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BUILDERS.map((b) => {
          const info = t.builders[b.id];
          return (
            <Link
              key={b.id}
              href={b.href}
              className="card card-frost group flex items-start gap-4 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_24px_70px_-36px_rgba(139,92,246,0.7)]"
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${b.grad} shadow-lg`}>
                <b.icon className="size-6 text-white" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{info.name}</span>
                  <ArrowRight className="size-4 text-zinc-600 transition-colors group-hover:text-violet-300" aria-hidden />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{info.tag}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
