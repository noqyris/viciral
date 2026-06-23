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
  title: string;
  description: string;
  icon: string;
  inputs: Record<string, unknown>;
}

export const TEMPLATES: Template[] = [
  // --- Social Pack ---
  {
    id: "sp-product-launch",
    moduleSlug: "social-pack",
    title: "Lansiranje proizvoda",
    description: "Najava novog proizvoda sa prednostima i pozivom na akciju.",
    icon: "🚀",
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
    title: "Nedeljni saveti",
    description: "Serija korisnih saveta iz tvoje oblasti za LinkedIn.",
    icon: "💡",
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
    title: "Iza scene",
    description: "Pokaži tim i proces rada na opušten, autentičan način.",
    icon: "🎥",
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
    title: "Landing za uslugu",
    description: "Stranica koja predstavlja uslugu i prikuplja kontakte.",
    icon: "📄",
    inputs: {
      description: "Predstavi uslugu, za koga je i zašto je bolja od konkurencije",
      goal: "prikupi prijave i kontakte",
    },
  },
  {
    id: "web-product-store",
    moduleSlug: "website",
    title: "Stranica proizvoda",
    description: "Prodajna stranica sa prednostima i poverenjem.",
    icon: "🛍️",
    inputs: {
      description: "Predstavi proizvod, njegove prednosti, recenzije i garanciju",
      goal: "prodaj proizvod",
    },
  },

  // --- Avatar / Presenter ---
  {
    id: "av-promo",
    moduleSlug: "avatar",
    title: "Najava akcije",
    description: "Kratka, energična najava popusta ili događaja.",
    icon: "📣",
    inputs: {
      script:
        "Zdravo! Imam sjajne vesti — pokrećemo specijalnu akciju ovog vikenda. Iskoristite priliku, ne propustite!",
      voiceId: "f2",
    },
  },
  {
    id: "av-explainer",
    moduleSlug: "avatar",
    title: "Objašnjenje u 3 koraka",
    description: "Smiren prezenter objašnjava kako proizvod rešava problem.",
    icon: "🧑‍🏫",
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
    title: "Podkast → kratki klipovi",
    description: "Iseci najjače momente iz dugog snimka za TikTok.",
    icon: "🎙️",
    inputs: { platform: "tiktok", clipCount: 5, approxMinutes: 30 },
  },

  // --- Image Tools ---
  {
    id: "it-story",
    moduleSlug: "image-tools",
    title: "Slika za Story (9:16)",
    description: "Prilagodi postojeću sliku na vertikalni format.",
    icon: "📱",
    inputs: { operation: "resize", aspectRatio: "9:16" },
  },
  {
    id: "it-clean",
    moduleSlug: "image-tools",
    title: "Ukloni pozadinu",
    description: "Izdvoj proizvod/osobu sa providnom pozadinom.",
    icon: "✂️",
    inputs: { operation: "bg-remove" },
  },

  // --- Muzika ---
  {
    id: "mu-reel",
    moduleSlug: "music",
    title: "Podloga za reels",
    description: "Energična upbeat muzika bez vokala, ~20s.",
    icon: "🎶",
    inputs: { prompt: "Energičan upbeat za reels, moderno, bez vokala", durationSec: 20 },
  },

  // --- Dubbing ---
  {
    id: "dub-en",
    moduleSlug: "dubbing",
    title: "Prevedi na engleski",
    description: "Lokalizuj video na engleski sa sinhronizovanim usnama.",
    icon: "🇬🇧",
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
