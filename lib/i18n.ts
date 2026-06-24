/** Shared (client+server safe) locale types. */
export const LOCALES = ["sr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "sr" || v === "en";
}

/** Pick the right side of a co-located `{ sr, en }` dictionary for a locale. */
export function pick<T>(locale: Locale, dict: { sr: T; en: T }): T {
  return dict[locale];
}
