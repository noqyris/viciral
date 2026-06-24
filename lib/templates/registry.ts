/**
 * Templates ("Recepti") — curated quick-start presets that pre-fill a module's
 * inputs so a non-expert gets a good result in one click (lowers activation, a
 * verified table-stakes gap). Each template's `inputs` is a partial of its
 * module's input schema; the module page seeds the runner from it.
 *
 * Adding a template = adding an entry here. A test validates every template's
 * inputs against its module's inputSchema so presets can't drift from the schema.
 */

export interface Template {
  id: string;
  moduleSlug: string;
  title: { sr: string; en: string };
  description: { sr: string; en: string };
  icon: string;
  inputs: Record<string, unknown>;
}

export const TEMPLATES: Template[] = [
  // --- Social Pack ---
  {
    id: "sp-product-launch",
    moduleSlug: "social-pack",
    title: { sr: "Lansiranje proizvoda", en: "Product launch" },
    description: {
      sr: "Najava novog proizvoda sa prednostima i pozivom na akciju.",
      en: "Announce a new product with its benefits and a call to action.",
    },
    icon: "rocket",
    inputs: {
      topic: "Lansiranje novog proizvoda — istakni ključne prednosti i jasan poziv na akciju",
      platform: "instagram",
      postCount: 3,
      tone: "energičan",
    },
  },
  {
    id: "sp-weekly-tips",
    moduleSlug: "social-pack",
    title: { sr: "Nedeljni saveti", en: "Weekly tips" },
    description: {
      sr: "Serija korisnih saveta iz tvoje oblasti za LinkedIn.",
      en: "A series of useful tips from your field for LinkedIn.",
    },
    icon: "lightbulb",
    inputs: {
      topic: "Korisni saveti iz naše oblasti — jedan konkretan savet po objavi",
      platform: "linkedin",
      postCount: 5,
      tone: "stručan",
    },
  },
  {
    id: "sp-behind-scenes",
    moduleSlug: "social-pack",
    title: { sr: "Iza scene", en: "Behind the scenes" },
    description: {
      sr: "Pokaži tim i proces rada na opušten, autentičan način.",
      en: "Show your team and work process in a relaxed, authentic way.",
    },
    icon: "film",
    inputs: {
      topic: "Iza scene — pokaži tim, radni prostor i proces nastanka proizvoda",
      platform: "tiktok",
      postCount: 3,
      tone: "opušten",
    },
  },

  // --- Website ---
  {
    id: "web-service-landing",
    moduleSlug: "website",
    title: { sr: "Landing za uslugu", en: "Service landing" },
    description: {
      sr: "Stranica koja predstavlja uslugu i prikuplja kontakte.",
      en: "A page that presents a service and collects contacts.",
    },
    icon: "file",
    inputs: {
      description: "Predstavi uslugu, za koga je i zašto je bolja od konkurencije",
      goal: "prikupi prijave i kontakte",
    },
  },
  {
    id: "web-product-store",
    moduleSlug: "website",
    title: { sr: "Stranica proizvoda", en: "Product page" },
    description: {
      sr: "Prodajna stranica sa prednostima i poverenjem.",
      en: "A sales page with benefits and trust signals.",
    },
    icon: "store",
    inputs: {
      description: "Predstavi proizvod, njegove prednosti, recenzije i garanciju",
      goal: "prodaj proizvod",
    },
  },

  // --- Avatar / Presenter ---
  {
    id: "av-promo",
    moduleSlug: "avatar",
    title: { sr: "Najava akcije", en: "Promo announcement" },
    description: {
      sr: "Kratka, energična najava popusta ili događaja.",
      en: "A short, energetic announcement of a discount or event.",
    },
    icon: "megaphone",
    inputs: {
      script:
        "Zdravo! Imam sjajne vesti — pokrećemo specijalnu akciju ovog vikenda. Iskoristite priliku, ne propustite!",
      voiceId: "f2",
    },
  },
  {
    id: "av-explainer",
    moduleSlug: "avatar",
    title: { sr: "Objašnjenje u 3 koraka", en: "3-step explainer" },
    description: {
      sr: "Smiren prezenter objašnjava kako proizvod rešava problem.",
      en: "A calm presenter explains how the product solves a problem.",
    },
    icon: "teacher",
    inputs: {
      script:
        "Danas vam objašnjavam kako naš proizvod rešava vaš problem u tri jednostavna koraka. Krenimo.",
      voiceId: "m1",
    },
  },

  // --- Short-Form Klipovi ---
  {
    id: "sf-podcast",
    moduleSlug: "short-form",
    title: { sr: "Podkast → kratki klipovi", en: "Podcast -> short clips" },
    description: {
      sr: "Iseci najjače momente iz dugog snimka za TikTok.",
      en: "Cut the strongest moments from a long recording for TikTok.",
    },
    icon: "mic",
    inputs: { platform: "tiktok", clipCount: 5, approxMinutes: 30 },
  },

  // --- Image Tools ---
  {
    id: "it-story",
    moduleSlug: "image-tools",
    title: { sr: "Slika za Story (9:16)", en: "Story image (9:16)" },
    description: {
      sr: "Prilagodi postojeću sliku na vertikalni format.",
      en: "Adapt an existing image to a vertical format.",
    },
    icon: "phone",
    inputs: { operation: "resize", aspectRatio: "9:16" },
  },
  {
    id: "it-clean",
    moduleSlug: "image-tools",
    title: { sr: "Ukloni pozadinu", en: "Remove background" },
    description: {
      sr: "Izdvoj proizvod/osobu sa providnom pozadinom.",
      en: "Isolate a product/person with a transparent background.",
    },
    icon: "scissors",
    inputs: { operation: "bg-remove" },
  },

  // --- Muzika ---
  {
    id: "mu-reel",
    moduleSlug: "music",
    title: { sr: "Podloga za reels", en: "Reels track" },
    description: {
      sr: "Energična upbeat muzika bez vokala, ~20s.",
      en: "Energetic upbeat music with no vocals, ~20s.",
    },
    icon: "music",
    inputs: { prompt: "Energičan upbeat za reels, moderno, bez vokala", durationSec: 20 },
  },

  // --- Dubbing ---
  {
    id: "dub-en",
    moduleSlug: "dubbing",
    title: { sr: "Prevedi na engleski", en: "Translate to English" },
    description: {
      sr: "Lokalizuj video na engleski sa sinhronizovanim usnama.",
      en: "Localize a video to English with synchronized lips.",
    },
    icon: "translate",
    inputs: { targetLang: "en", approxSeconds: 30 },
  },
];

/** Templates for a given module slug (in registry order). */
export function templatesFor(slug: string): Template[] {
  return TEMPLATES.filter((t) => t.moduleSlug === slug);
}

/** A single template by id, scoped to a module slug (ignores cross-module ids). */
export function getTemplate(id: string, slug?: string): Template | undefined {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) return undefined;
  if (slug && t.moduleSlug !== slug) return undefined;
  return t;
}
