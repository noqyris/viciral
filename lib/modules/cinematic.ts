import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { submitVideoJob } from "./async-video";
import type { ModuleDef } from "./types";

/**
 * Cinematic Video — async module. Image + prompt → a cinematic clip via Seedance
 * (fal queue). It submits a job and returns; the fal webhook settles credits and
 * persists the clip (lib/jobs/settle.ts). Premium / gated behind higher tiers.
 */

const WIDTH = 720;
const HEIGHT = 1280;

const inputSchema = z.object({
  prompt: z.string().min(2, "Opis je obavezan").max(500),
  imageUrl: z.string().url("Potrebna je URL adresa polazne slike"),
  durationSec: z.union([z.literal(5), z.literal(10)]).default(5),
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
    return submitVideoJob(
      ctx,
      "seedance-2",
      {
        prompt: ctx.inputs.prompt,
        imageUrl: ctx.inputs.imageUrl,
        durationSec: ctx.inputs.durationSec,
        width: WIDTH,
        height: HEIGHT,
        withAudio: ctx.inputs.withAudio,
      },
      { durationSec: ctx.inputs.durationSec, width: WIDTH, height: HEIGHT },
    );
  },
};
