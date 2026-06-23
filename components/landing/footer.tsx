import Link from "next/link";

import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    region: "Podnožje",
    tagline: "AI studio koji spaja više modela",
    nav: "Linkovi u podnožju",
    links: [
      { href: "#moduli", label: "Moduli" },
      { href: "#primeri", label: "Primeri" },
      { href: "#cena-truda", label: "Cena" },
    ],
    login: "Prijava →",
    powered: "Pokreće: Claude · Nano Banana · Seedance",
    rights: "Sva prava zadržana.",
  },
  en: {
    region: "Footer",
    tagline: "AI studio that brings multiple models together",
    nav: "Footer links",
    links: [
      { href: "#moduli", label: "Modules" },
      { href: "#primeri", label: "Examples" },
      { href: "#cena-truda", label: "Pricing" },
    ],
    login: "Log in →",
    powered: "Powered by: Claude · Nano Banana · Seedance",
    rights: "All rights reserved.",
  },
} as const;

/**
 * Footer — lights down. A quiet, trustworthy close: a hairline top border over
 * the page, the brand mark with a one-line mono summary, the three primary
 * anchors, the language toggle and a login link, then a mono credibility line
 * naming the real engines plus the copyright. Stacks vertically on mobile.
 * Static server component (LanguageSwitcher is the only client island).
 */
export default function Footer({ locale }: { locale: Locale }) {
  const t = T[locale];
  const year = 2026;

  return (
    <footer aria-label={t.region} className="w-full border-t border-white/10">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <Reveal dir="up">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Identity */}
            <div className="flex flex-col gap-3">
              <Logo size={28} />
              <p className="mono max-w-xs text-sm leading-relaxed text-zinc-500">
                {t.tagline}
              </p>
            </div>

            {/* Links + controls */}
            <div className="flex flex-col gap-5 md:items-end">
              <nav aria-label={t.nav}>
                <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  {t.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-zinc-400 transition-colors hover:text-white focus-visible:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:text-white"
                >
                  {t.login}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Credibility line + copyright */}
        <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono">{t.powered}</p>
          <p className="mono">
            &copy; {year} Viciral. {t.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
