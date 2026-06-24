"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    nav: "Glavna navigacija",
    modules: "Moduli",
    examples: "Primeri",
    effort: "Cena truda",
    login: "Prijava",
    cta: "Počni besplatno →",
  },
  en: {
    nav: "Primary navigation",
    modules: "Modules",
    examples: "Examples",
    effort: "Cost of effort",
    login: "Log in",
    cta: "Start free →",
  },
} as const;

const ANCHORS = [
  { href: "#modules", key: "modules" },
  { href: "#examples", key: "examples" },
  { href: "#cost-of-effort", key: "effort" },
] as const;

/**
 * Sticky landing nav — transparent over the dark hero, frosting to a blurred
 * bar past ~40px scroll. A single .nav-thread on the bottom edge is the only
 * stroke of brand color. The scroll listener is rAF-throttled + passive.
 */
export default function SiteNav({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [frosted, setFrosted] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setFrosted(window.scrollY > 40);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        frosted ? "bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      <nav
        aria-label={t.nav}
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3"
      >
        <Logo size={28} />

        <div className="flex items-center gap-2 sm:gap-3">
          <ul className="mono hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            {ANCHORS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="transition-colors hover:text-white focus-visible:text-white"
                >
                  {t[a.key]}
                </Link>
              </li>
            ))}
          </ul>

          <LanguageSwitcher />

          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:text-white sm:inline-flex"
          >
            {t.login}
          </Link>

          <Link href="/signup" className="btn-primary text-sm">
            {t.cta}
          </Link>
        </div>
      </nav>

      <div className="nav-thread" aria-hidden />
    </header>
  );
}
