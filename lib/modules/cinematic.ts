import { z } from "zod";
import { estimateCredits } from "@/lib/credits/pricing";
import { env } from "@/lib/env";
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
});

type Input = z.infer<typeof inputSchema>;

/** Where fal posts the job-complete webhook. A shared token guards the endpoint. */
function falWebhookUrl(): string | undefined {
  const base = env.APP_URL?.replace(/\/$/, "");
  if (!base) return undefined;
  const url = `${base}/api/webhooks/fal`;
  return env.FAL_WEBHOOK_SECRET
    ? `${url}?token=${encodeURIComponent(env.FAL_WEBHOOK_SECRET)}`
    : url;
}

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

  estimateCredits(input) {
    return estimateCredits("seedance-2", {
      durationSec: input.durationSec,
      width: WIDTH,
      height: HEIGHT,
    });
  },

  async submit(ctx) {
    const res = await ctx.providers.video.submitVideo({
      modelId: "seedance-2",
      prompt: ctx.inputs.prompt,
      imageUrl: ctx.inputs.imageUrl,
      durationSec: ctx.inputs.durationSec,
      width: WIDTH,
      height: HEIGHT,
      webhookUrl: falWebhookUrl(),
    });
    return {
      requestId: res.requestId,
      modelId: "seedance-2",
      params: { durationSec: ctx.inputs.durationSec, width: WIDTH, height: HEIGHT },
    };
  },
};
