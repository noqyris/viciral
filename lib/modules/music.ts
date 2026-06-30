import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { finishSingleAsset } from "./single-asset";
import type { ModuleDef } from "./types";

/**
 * Muzika / Soundtrack — generate a royalty-friendly music track from a text
 * description (for use under videos/reels) via Google Lyria 2 (fal). Lyria
 * outputs a FIXED 30-second 48kHz clip, so there is no duration control and the
 * cost is a flat per-generation charge. Sync (completes inline).
 */

const inputSchema = z.object({
  prompt: z.string().min(2, "Opiši muziku").max(2000),
});

type Input = z.infer<typeof inputSchema>;

export const musicModule: ModuleDef<Input> = {
  slug: "music",
  name: "Muzika / Soundtrack",
  tagline: "Opis → muzička podloga (30s, Lyria 2).",
  category: "audio",
  status: "available",
  supportsAuto: false,
  icon: "🎵",
  inputSchema,

  estimateCredits() {
    return estimateModuleCredits("music");
  },

  async generate(ctx) {
    const { prompt } = ctx.inputs;
    const generateMusic = ctx.providers.audio.generateMusic;
    if (!generateMusic) {
      throw new Error("Generisanje muzike trenutno nije dostupno.");
    }

    ctx.onProgress?.("Komponujem…");
    // Lyria ignores durationSec (fixed 30s); pass it for the shared interface.
    const result = await generateMusic({ modelId: "lyria-2", prompt, durationSec: 30 });

    const credits = estimateModuleCredits("music");
    return finishSingleAsset(
      ctx,
      result.audioUrl,
      (url) => ({ kind: "audio", url, modelId: "lyria-2", meta: { prompt } }),
      credits,
      "Muzika nije generisana. Pokušaj drugačiji opis.",
    );
  },
};
