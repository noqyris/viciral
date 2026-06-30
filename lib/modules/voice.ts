import { z } from "zod";
import { estimateCredits } from "@/lib/credits/pricing";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import type { GeneratedAsset, ModuleDef } from "./types";

/**
 * Voiceover — text → spoken audio via ElevenLabs (fal). A lean Content capability
 * (the Content "Voice" tab): pick a voice preset, type a script, get a downloadable
 * MP3. Billed per 1000 characters, so the reservation = the exact script length.
 */

const VOICES = [
  "Rachel", "Aria", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River",
  "Liam", "Charlotte", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian",
  "Daniel", "Lily", "Bill",
] as const;

const inputSchema = z.object({
  text: z.string().min(1, "Tekst je obavezan").max(5000),
  voice: z.enum(VOICES).default("Rachel"),
  // ---- Advanced ----
  stability: z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).default(0),
  speed: z.number().min(0.7).max(1.2).default(1),
  /** ISO 639-1 (empty = auto-detect). */
  language: z.string().max(8).default(""),
});

type Input = z.infer<typeof inputSchema>;

export const voiceModule: ModuleDef<Input> = {
  slug: "voice",
  name: "Voiceover",
  tagline: "Tekst → glasovna naracija (ElevenLabs).",
  category: "audio",
  status: "available",
  supportsAuto: false,
  icon: "🎙️",
  inputSchema,

  estimateCredits(inputs) {
    return estimateModuleCredits("voice", inputs as Record<string, unknown>);
  },

  async generate(ctx) {
    const input = ctx.inputs;
    if (!ctx.providers.audio.generateSpeech) {
      throw new Error("Generisanje glasa nije dostupno.");
    }
    ctx.onProgress?.("Generišem glas…");

    const res = await ctx.providers.audio.generateSpeech({
      modelId: "elevenlabs-tts",
      text: input.text,
      voice: input.voice,
      stability: input.stability,
      similarityBoost: input.similarityBoost,
      style: input.style,
      speed: input.speed,
      ...(input.language.trim() ? { languageCode: input.language.trim() } : {}),
    });
    if (!res.audioUrl) throw new Error("Glas nije generisan. Pokušaj ponovo.");

    // Charge only on success — by the exact script length (reserve == charge).
    const credits = estimateCredits("elevenlabs-tts", { chars: input.text.length });
    ctx.spend?.(credits);

    const assets: GeneratedAsset[] = [
      { kind: "audio", url: res.audioUrl, modelId: "elevenlabs-tts", meta: { voice: input.voice } },
    ];
    return { assets, creditsUsed: credits };
  },
};
