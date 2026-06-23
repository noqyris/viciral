import type { ReactNode } from "react";
import Link from "next/link";
import { MODULES } from "@/lib/modules/registry";
import { Reveal } from "@/components/reveal";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import { moduleName } from "@/lib/modules/i18n";
import {
  PostMock,
  VideoMock,
  VerticalMock,
  BrowserMock,
  BrandMock,
} from "@/components/landing-mocks";

const T = {
  sr: {
    login: "Prijava",
    startFree: "Počni besplatno →",
    heroBadge: "AI studio koji spaja više modela",
    heroTitleA: "Napravi ono što sam ",
    heroTitleHi: "ne možeš",
    heroTitleB: ".",
    heroSub:
      "Viciral orkestrira Claude, Nano Banana i Seedance na jednom mestu — sadržaj za društvene mreže, cinematic video, avatare, brend identitet i sajtove.",
    ctaCredits: "Počni besplatno → 200 kredita",
    seeExamples: "Vidi prave primere",
    beforeAfterTitleA: "Sam je teško. ",
    beforeAfterTitleHi: "Sa nama je gotovo.",
    beforeAfterSub: "Pravi primeri — napravljeni baš ovim alatom, bez ekipe i alata.",
    try: "Probaj →",
    modulesTitle: (n: number) => `Svih ${n} modula na jednom mestu`,
    modulesSub: "Plus doterivanje slike, editor, muzika i dubbing.",
    ctaTitle: "Spreman da probaš?",
    ctaSub: "200 besplatnih kredita. Bez kartice.",
    createAccount: "Napravi nalog →",
    footerLogin: "Prijava →",
  },
  en: {
    login: "Log in",
    startFree: "Start free →",
    heroBadge: "An AI studio that combines multiple models",
    heroTitleA: "Make what you ",
    heroTitleHi: "can't make alone",
    heroTitleB: ".",
    heroSub:
      "Viciral orchestrates Claude, Nano Banana and Seedance in one place — social media content, cinematic video, avatars, brand identity and websites.",
    ctaCredits: "Start free → 200 credits",
    seeExamples: "See real examples",
    beforeAfterTitleA: "Alone it's hard. ",
    beforeAfterTitleHi: "With us it's done.",
    beforeAfterSub: "Real examples — made with this very tool, with no crew and no other apps.",
    try: "Try it →",
    modulesTitle: (n: number) => `All ${n} modules in one place`,
    modulesSub: "Plus image touch-ups, an editor, music and dubbing.",
    ctaTitle: "Ready to try it?",
    ctaSub: "200 free credits. No card needed.",
    createAccount: "Create account →",
    footerLogin: "Log in →",
  },
} as const;

interface Hook {
  icon: string;
  grad: string;
  nameKey: "socialPack" | "cinematic" | "avatar" | "brandKit" | "website" | "shortForm";
  slug: string;
  mock: ReactNode;
}

const HOOK_T = {
  sr: {
    socialPack: {
      name: "Social Media Paket",
      pain: "Satima smišljaš caption-e, plaćaš dizajnera za slike, objave deluju nepovezano.",
      gain: "Ceo set objava — slika + caption + hashtagovi — konzistentno sa tvojim brendom, za minut.",
    },
    cinematic: {
      name: "Cinematic Video",
      pain: "Skupa produkcija — kamera, ekipa, montaža. Dani rada za jedan klip.",
      gain: "Slika + opis → kinematski klip sa zvukom, za par minuta. Bez ekipe.",
    },
    avatar: {
      name: "Avatar / Presenter",
      pain: "Snimaš sebe — svetlo, mikrofon, 20 pokušaja. Ili plaćaš glumca i studio.",
      gain: "Portret + skripta → osoba govori (lip-sync). Bez kamere, na bilo kom jeziku.",
    },
    brandKit: {
      name: "Brand Kit",
      pain: "Brending agencija — nedelje čekanja, skupo. Nedosledan vizuelni identitet.",
      gain: "Ton, paleta, logo i avatar za par minuta — i pamti se u SVAKOJ sledećoj generaciji.",
    },
    website: {
      name: "Website Builder",
      pain: "Učiš alate ili plaćaš developera. Prazna strana — ne znaš odakle da kreneš.",
      gain: "Opis brenda → responsive sajt sa tekstom i slikama. Preuzmi i objavi odmah.",
    },
    shortForm: {
      name: "Short-Form Klipovi",
      pain: "Gledaš ceo snimak i ručno tražiš najbolje delove. Pogađaš šta će biti viralno.",
      gain: "Dug video → AI bira najjače momente: hook + caption + viral score. Spremno za reels.",
    },
  },
  en: {
    socialPack: {
      name: "Social Media Pack",
      pain: "Hours writing captions, paying a designer for images, posts that feel disconnected.",
      gain: "A whole set of posts — image + caption + hashtags — consistent with your brand, in a minute.",
    },
    cinematic: {
      name: "Cinematic Video",
      pain: "Expensive production — camera, crew, editing. Days of work for a single clip.",
      gain: "Image + description → a cinematic clip with sound, in minutes. No crew.",
    },
    avatar: {
      name: "Avatar / Presenter",
      pain: "Filming yourself — lighting, mic, 20 takes. Or paying for an actor and a studio.",
      gain: "Portrait + script → a person speaks it (lip-sync). No camera, in any language.",
    },
    brandKit: {
      name: "Brand Kit",
      pain: "A branding agency — weeks of waiting, expensive. An inconsistent visual identity.",
      gain: "Voice, palette, logo and avatar in minutes — and remembered in EVERY future generation.",
    },
    website: {
      name: "Website Builder",
      pain: "Learning the tools or paying a developer. A blank page — you don't know where to start.",
      gain: "Brand description → a responsive site with copy and images. Download and publish right away.",
    },
    shortForm: {
      name: "Short-Form Clips",
      pain: "Watching the whole recording and hunting for the best parts by hand. Guessing what goes viral.",
      gain: "Long video → AI picks the strongest moments: hook + caption + viral score. Ready for reels.",
    },
  },
} as const;

function buildHooks(locale: Locale): Hook[] {
  return [
    {
      icon: "✨",
      grad: "from-pink-500 to-rose-500",
      nameKey: "socialPack",
      slug: "social-pack",
      mock: <PostMock locale={locale} />,
    },
    {
      icon: "🎬",
      grad: "from-violet-500 to-indigo-500",
      nameKey: "cinematic",
      slug: "cinematic",
      mock: (
        <VideoMock
          src="/examples/cinematic.png"
          alt={locale === "en" ? "Cinematic video example" : "Primer cinematic videa"}
        />
      ),
    },
    {
      icon: "🗣️",
      grad: "from-fuchsia-500 to-purple-500",
      nameKey: "avatar",
      slug: "avatar",
      mock: (
        <VerticalMock
          src="/examples/avatar.png"
          alt={locale === "en" ? "Avatar example" : "Primer avatara"}
          caption={
            locale === "en"
              ? "Hi! Let me introduce our new collection…"
              : "Zdravo! Predstavljam vam našu novu kolekciju…"
          }
        />
      ),
    },
    {
      icon: "🎨",
      grad: "from-amber-500 to-orange-500",
      nameKey: "brandKit",
      slug: "brand-kit",
      mock: <BrandMock locale={locale} />,
    },
    {
      icon: "🌐",
      grad: "from-emerald-500 to-teal-500",
      nameKey: "website",
      slug: "website",
      mock: <BrowserMock locale={locale} />,
    },
    {
      icon: "✂️",
      grad: "from-sky-500 to-blue-500",
      nameKey: "shortForm",
      slug: "short-form",
      mock: (
        <VerticalMock
          src="/examples/shortform.png"
          alt={locale === "en" ? "Short-form clip example" : "Primer short-form klipa"}
          caption={
            locale === "en"
              ? "3 reasons everyone is talking about this"
              : "3 razloga zašto svi pričaju o ovome"
          }
          score={92}
        />
      ),
    },
  ];
}

function TextPanel({ h, locale }: { h: Hook; locale: Locale }) {
  const t = T[locale];
  const copy = HOOK_T[locale][h.nameKey];
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${h.grad} text-2xl shadow-lg`}>
          {h.icon}
        </span>
        <h3 className="text-2xl font-bold text-white">{copy.name}</h3>
      </div>
      <div className="space-y-3">
        <p className="flex items-start gap-2.5 text-zinc-500">
          <span className="mt-0.5 text-zinc-600">✕</span>
          <span>{copy.pain}</span>
        </p>
        <p className="flex items-start gap-2.5 text-lg font-medium text-zinc-100">
          <span className="mt-1 text-violet-300">✓</span>
          <span>{copy.gain}</span>
        </p>
      </div>
      <Link
        href={`/studio/${h.slug}`}
        className="mt-6 inline-block rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/20"
      >
        {t.try}
      </Link>
    </div>
  );
}

export default async function Home() {
  const locale = await getLocale();
  const t = T[locale];
  const hooks = buildHooks(locale);

  return (
    <main className="flex w-full flex-1 flex-col items-center">
      {/* Top nav */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#0a0a0f]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-[0_4px_20px_-4px_rgba(139,92,246,0.7)]">
              V
            </span>
            <span className="text-lg font-semibold tracking-tight">Viciral</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm text-zinc-300 hover:text-white">
              {t.login}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_rgba(139,92,246,0.8)] transition-all hover:from-violet-400 hover:to-indigo-400"
            >
              {t.startFree}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-24 pb-16 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          {t.heroBadge}
        </span>
        <h1 className="max-w-3xl text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          {t.heroTitleA}
          <span className="gradient-text">{t.heroTitleHi}</span>
          {t.heroTitleB}
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-zinc-400">
          {t.heroSub}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-8px_rgba(139,92,246,0.85)] transition-all hover:from-violet-400 hover:to-indigo-400"
          >
            {t.ctaCredits}
          </Link>
          <a
            href="#kako"
            className="rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
          >
            {t.seeExamples}
          </a>
        </div>
      </section>

      {/* Before / after with real examples */}
      <section id="kako" className="mx-auto w-full max-w-5xl px-6 py-12">
        <Reveal>
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t.beforeAfterTitleA}
              <span className="gradient-text">{t.beforeAfterTitleHi}</span>
            </h2>
            <p className="mt-3 text-zinc-400">
              {t.beforeAfterSub}
            </p>
          </div>
        </Reveal>

        <div className="space-y-24">
          {hooks.map((h, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={h.slug} className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
                <Reveal
                  dir={flip ? "right" : "left"}
                  className={flip ? "md:order-2" : "md:order-1"}
                >
                  <TextPanel h={h} locale={locale} />
                </Reveal>
                <Reveal
                  dir={flip ? "left" : "right"}
                  delay={120}
                  className={flip ? "md:order-1" : "md:order-2"}
                >
                  {h.mock}
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      {/* All modules */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <Reveal>
          <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-white">
            {t.modulesTitle(MODULES.length)}
          </h2>
          <p className="mb-10 text-center text-zinc-400">
            {t.modulesSub}
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MODULES.map((m, i) => (
            <Reveal key={m.slug} delay={(i % 5) * 60}>
              <Link
                href={`/studio/${m.slug}`}
                className="flex h-full flex-col items-start rounded-xl border border-white/10 bg-white/[0.035] p-4 transition-all hover:border-violet-400/40 hover:bg-white/[0.06]"
              >
                <span className="text-xl">{m.icon}</span>
                <span className="mt-2 text-sm font-medium text-zinc-200">
                  {moduleName(m.slug, locale, m.name)}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-white">{t.ctaTitle}</h2>
            <p className="mt-3 text-zinc-400">{t.ctaSub}</p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_10px_40px_-8px_rgba(139,92,246,0.85)] transition-all hover:from-violet-400 hover:to-indigo-400"
            >
              {t.createAccount}
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="w-full border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span className="font-semibold text-zinc-300">Viciral</span>
          <Link href="/login" className="hover:text-zinc-200">
            {t.footerLogin}
          </Link>
        </div>
      </footer>
    </main>
  );
}
