import { z } from "zod";
import type { ModuleDef } from "./types";
import { socialPackModule } from "./social-pack";
import { cinematicModule } from "./cinematic";

/**
 * Module registry. The hub renders from this list; new modules are added here.
 * "soon" entries are metadata-only placeholders for the planned build sequence
 * (cinematic video → brand kit → website builder).
 */

function soon(
  slug: string,
  name: string,
  tagline: string,
  category: string,
  icon: string,
): ModuleDef {
  return {
    slug,
    name,
    tagline,
    category,
    icon,
    status: "soon",
    supportsAuto: false,
    inputSchema: z.any(),
    estimateCredits: () => 0,
    generate: async () => {
      throw new Error(`Modul "${slug}" još nije dostupan.`);
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODULES: ModuleDef<any>[] = [
  socialPackModule,
  cinematicModule,
  soon(
    "brand-kit",
    "Brand Kit",
    "Logo, paleta, avatar i ton — kompletan vizuelni identitet.",
    "brand",
    "🎨",
  ),
  soon(
    "website",
    "Website Builder",
    "Opis brenda → responsive sajt sa tekstom i slikama.",
    "web",
    "🌐",
  ),
];

export function getModuleDef(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}
