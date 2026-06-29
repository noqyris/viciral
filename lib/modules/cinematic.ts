import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { VIDEO_DIMENSIONS } from "@/lib/credits/pricing";
import { submitVideoJob } from "./async-video";
import type { ModuleDef } from "./types";

/**
 * Cinematic Video — async module, and the per-segment generator behind the
 * Content "Video" builder. Image + prompt → one Seedance clip (≤15s) via the fal
 * queue; the fal webhook settles credits and persists the clip (lib/jobs/settle).
 * Arbitrary-length video chains many of these (extract last frame → next clip →
 * merge) in the client (components/video-runner.tsx). Premium / gated.
 */

const { width: WIDTH, height: HEIGHT } = VIDEO_DIMENSIONS;

// Aspect ratios Seedance accepts directly (subset that's also useful socially).
const ASPECTS = ["9:16", "16:9", "1:1", "4:3", "3:4"] as const;

const inputSchema = z.object({
  prompt: z.string().min(2, "Opis je obavezan").max(500),
  imageUrl: z.string().url("Potrebna je URL adresa polazne slike"),
  // Seedance caps a single clip at 15s; longer videos are built by chaining clips.
  durationSec: z.number().int().min(4).max(15).default(5),
  aspectRatio: z.enum(ASPECTS).default("9:16"),
  withAudio: z.boolean().default(true),
});

type Input = z.infer<typeof inputSchema>;

export const cinematicModule: ModuleDef<Input> = {
  slug: "cinematic",
  name: "Cinematic Video",
  tagline: "Slika + opis → kinematski video klip (Seedance).",
  category: "video",
  status: "available",
  kind: "async",
  supportsAuto: false,
  icon: "🎬",
  inputSchema,

  // Shared with the client cost hint (single source of truth).
  estimateCredits(input) {
    return estimateModuleCredits("cinematic", input as Record<string, unknown>);
  },

  async submit(ctx) {
    // Inject the brand block into the prompt (text-level on-brand). The start
    // frame is the user's image, so visual identity comes from there (Seedance
    // takes a single imageUrl — no reference-image array).
    const prompt = ctx.brandContext?.hasIdentity
      ? `${ctx.inputs.prompt} ${ctx.brandContext.promptBlock}`
      : ctx.inputs.prompt;
    return submitVideoJob(
      ctx,
      "seedance-2",
      {
        prompt,
        imageUrl: ctx.inputs.imageUrl,
        durationSec: ctx.inputs.durationSec,
        aspectRatio: ctx.inputs.aspectRatio,
        width: WIDTH,
        height: HEIGHT,
        withAudio: ctx.inputs.withAudio,
      },
      { durationSec: ctx.inputs.durationSec, width: WIDTH, height: HEIGHT },
    );
  },
};
