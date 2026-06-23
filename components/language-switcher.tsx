"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-context";

/** SR / EN toggle. Sets the locale cookie and refreshes so server + client re-render. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();

  function set(l: Locale) {
    if (l === locale) return;
    // Browser API write in an event handler (not a render mutation).
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs font-medium ${className}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={locale === l}
          className={`rounded-md px-2 py-1 transition-colors ${
            locale === l ? "bg-violet-500/20 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
