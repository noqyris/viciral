import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { submitVideoJob } from "./async-video";
import type { ModuleDef } from "./types";

/**
 * Dubbing / Lokalizacija — async module. A source video → the same video in
 * another language (speech translated + lips re-synced) via a fal model. One
 * target language per run; submit a queued job, the fal webhook settles it
 * (lib/jobs/settle.ts, generic over the async video model). The multilingual
 * wedge for non-English markets. Premium / gated.
 */

export const DUB_LANGUAGES = [
  { id: "en", label: "Engleski" },
  { id: "es", label: "Španski" },
  { id: "de", label: "Nemački" },
  { id: "fr", label: "Francuski" },
  { id: "it", label: "Italijanski" },
  { id: "ar", label: "Arapski" },
] as const;

const LANG_IDS = DUB_LANGUAGES.map((l) => l.id) as [string, ...string[]];

const inputSchema = z.object({
  videoUrl: z.string().url("Potreban je URL videa"),
  targetLang: z.enum(LANG_IDS).default("en"),
  approxSeconds: z.number().int().min(5).max(300).default(30),
});

type Input = z.infer<typeof inputSchema>;

export const dubbingModule: ModuleDef<Input> = {
  slug: "dubbing",
  name: "Dubbing / Lokalizacija",
  tagline: "Video → isti video na drugom jeziku (prevod + sinhronizovane usne).",
  category: "video",
  status: "available",
  kind: "async",
  supportsAuto: false,
  icon: "🌍",
  inputSchema,

  estimateCredits(input) {
    return estimateModuleCredits("dubbing", input as Record<string, unknown>);
  },

  async submit(ctx) {
    return submitVideoJob(
      ctx,
      "video-dub",
      {
        videoUrl: ctx.inputs.videoUrl,
        targetLang: ctx.inputs.targetLang,
        durationSec: ctx.inputs.approxSeconds,
      },
      // Stable settlement basis (declared length) — webhook re-derives the same charge.
      { durationSec: ctx.inputs.approxSeconds },
    );
  },
};
