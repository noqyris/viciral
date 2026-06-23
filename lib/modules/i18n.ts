import type { Locale } from "@/lib/i18n";

/**
 * English labels for module name/tagline (the registry holds Serbian). Keyed by
 * slug; falls back to the registry value if a slug isn't listed.
 */
const MODULE_I18N: Record<string, { name: string; tagline: string }> = {
  "social-pack": {
    name: "Social Media Pack",
    tagline: "Theme → a set of posts (images + caption + hashtags) for IG/TikTok/LinkedIn.",
  },
  cinematic: {
    name: "Cinematic Video",
    tagline: "Image + prompt → a cinematic video clip (Seedance).",
  },
  "brand-kit": {
    name: "Brand Kit",
    tagline: "Name + description → voice, palette, logo and avatar (fills brand memory).",
  },
  website: {
    name: "Website Builder",
    tagline: "Brand description → a responsive site with copy and images.",
  },
  "image-tools": {
    name: "Image Tools",
    tagline: "Remove the background, upscale, or reframe an image.",
  },
  "short-form": {
    name: "Short-Form Clips",
    tagline: "Long video → a plan of the best short clips (hook + caption + score).",
  },
  editor: {
    name: "Image Editor",
    tagline: "Edit an image with words — fix a detail, swap the background, layer by layer.",
  },
  avatar: {
    name: "Avatar / Presenter",
    tagline: "Portrait + script → a video where a person speaks the text (lip-sync).",
  },
  dubbing: {
    name: "Dubbing / Localization",
    tagline: "Video → the same video in another language (translation + lip-sync).",
  },
  music: {
    name: "Music / Soundtrack",
    tagline: "Description → a music track for video and reels (per second).",
  },
};

export function moduleName(slug: string, locale: Locale, fallbackSr: string): string {
  return locale === "en" ? (MODULE_I18N[slug]?.name ?? fallbackSr) : fallbackSr;
}

export function moduleTagline(slug: string, locale: Locale, fallbackSr: string): string {
  return locale === "en" ? (MODULE_I18N[slug]?.tagline ?? fallbackSr) : fallbackSr;
}

/** Localized category labels for the hub. */
export const CATEGORY_LABEL: Record<string, { sr: string; en: string }> = {
  social: { sr: "Društvene mreže", en: "Social media" },
  video: { sr: "Video", en: "Video" },
  brand: { sr: "Brend", en: "Brand" },
  web: { sr: "Web", en: "Web" },
  image: { sr: "Slike", en: "Images" },
  audio: { sr: "Zvuk", en: "Audio" },
};
