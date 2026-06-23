import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { finishSingleAsset } from "./single-asset";
import type { ModuleDef } from "./types";

/**
 * Muzika / Soundtrack — generate a royalty-friendly music track from a text
 * description for use under videos/reels. One fal music model behind the audio
 * provider capability. Sync (completes inline).
 */

const inputSchema = z.object({
  prompt: z.string().min(2, "Opiši muziku").max(500),
  durationSec: z.number().int().min(5).max(120).default(20),
});

type Input = z.infer<typeof inputSchema>;

export const musicModule: ModuleDef<Input> = {
  slug: "music",
  name: "Muzika / Soundtrack",
  tagline: "Opis → muzička podloga za video i reels (po sekundi).",
  category: "audio",
  status: "available",
  supportsAuto: false,
  icon: "🎵",
  inputSchema,

  estimateCredits(input) {
    return estimateModuleCredits("music", input as Record<string, unknown>);
  },

  async generate(ctx) {
    const { prompt, durationSec } = ctx.inputs;
    const generateMusic = ctx.providers.audio.generateMusic;
    if (!generateMusic) {
      throw new Error("Generisanje muzike trenutno nije dostupno.");
    }

    ctx.onProgress?.("Komponujem…");
    const result = await generateMusic({ modelId: "music-gen", prompt, durationSec });

    const credits = estimateModuleCredits("music", ctx.inputs as Record<string, unknown>);
    return finishSingleAsset(
      ctx,
      result.audioUrl,
      (url) => ({ kind: "audio", url, modelId: "music-gen", meta: { prompt, durationSec } }),
      credits,
      "Muzika nije generisana. Pokušaj drugačiji opis.",
    );
  },
};
