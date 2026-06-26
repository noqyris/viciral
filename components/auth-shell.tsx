"use client";

import { Check } from "lucide-react";
import { Logo, BrandMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-context";

const T = {
  sr: {
    eyebrow: "Multi-model AI studio",
    headA: "Napravi ono ",
    headHi: "što sam",
    headB: " ne možeš.",
    sub: "Claude, Nano Banana i Seedance — spojeni u gotov sadržaj. Prijavi se i izaberi modul.",
    bullets: [
      "200 besplatnih kredita za početak",
      "10 modula — social, video, brend, web",
      "Pravi modeli, izvoz u punoj rezoluciji",
      "Bez kartice",
    ],
    footnote: "1 kredit = $0.01 · plaćaš samo modele koje pokreneš.",
  },
  en: {
    eyebrow: "Multi-model AI studio",
    headA: "Make what you ",
    headHi: "can't",
    headB: " alone.",
    sub: "Claude, Nano Banana and Seedance — orchestrated into finished content. Sign in and pick a module.",
    bullets: [
      "200 free credits to start",
      "10 modules — social, video, brand, web",
      "Real models, full-resolution exports",
      "No card required",
    ],
    footnote: "1 credit = $0.01 · you only pay for the models you run.",
  },
} as const;

/** Premium split auth layout: a branded showcase panel (left, desktop) beside
 *  the form (right). Echoes the landing's aurora + eyebrow + gradient language. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = T[useLocale()];

  return (
    <main className="relative min-h-screen w-full lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute right-5 top-5 z-30">
        <LanguageSwitcher />
      </div>

      {/* ---------- LEFT: branded showcase (desktop) ---------- */}
      <aside className="relative hidden overflow-hidden border-r border-white/10 p-12 xl:p-16 lg:flex lg:flex-col lg:justify-between">
        {/* aurora mesh + masked grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_12%_8%,rgba(139,92,246,0.30),transparent_55%),radial-gradient(110%_85%_at_92%_100%,rgba(56,189,248,0.20),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(circle_at_28%_24%,black,transparent_72%)]"
        />
        <BrandMark
          size={420}
          className="pointer-events-none absolute -bottom-24 -right-24 opacity-[0.06] blur-[1px]"
        />

        <div className="relative">
          <Logo size={30} href={null} />
        </div>

        <div className="relative">
          <p className="eyebrow">
            <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
            {t.eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-[2.6rem] font-bold leading-[1.02] tracking-tight text-white xl:text-5xl">
            {t.headA}
            <span className="gradient-text">{t.headHi}</span>
            {t.headB}
          </h2>
          <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-zinc-400">{t.sub}</p>

          <ul className="mt-9 space-y-3.5">
            {t.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[15px] text-zinc-200">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-500/15 ring-1 ring-inset ring-violet-400/30">
                  <Check className="size-3 text-violet-300" strokeWidth={3} aria-hidden />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mono text-xs text-zinc-500">{t.footnote}</p>
      </aside>

      {/* ---------- RIGHT: the form ---------- */}
      <div className="relative flex min-h-screen items-center justify-center px-6 py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)] lg:hidden"
        />
        <div className="relative w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
