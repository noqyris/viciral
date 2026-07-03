import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import {
  RESOLUTION_DIMENSIONS,
  veoSnap,
  soraSnap,
  veoMult,
  klingMult,
  type UsageParams,
} from "@/lib/credits/pricing";
import { submitVideoJob } from "./async-video";
import type { ModuleDef } from "./types";

/**
 * Cinematic Video — async module, and the per-segment generator behind the
 * Content "Video" builder. Image + prompt → one clip via the chosen video model
 * (Seedance / Veo 3.1 / Kling 3.0) on the fal queue; the fal webhook settles
 * credits and persists the clip. Arbitrary-length video chains many of these
 * (extract last frame → next clip → merge) client-side. Premium / gated.
 */

const ASPECTS = ["9:16", "16:9", "1:1", "4:3", "3:4"] as const;
const RESOLUTIONS = ["480p", "720p", "1080p", "4k"] as const;
const VIDEO_MODELS = ["seedance", "veo", "kling", "sora"] as const;
type VideoModel = (typeof VIDEO_MODELS)[number];

const MODEL_ID: Record<VideoModel, string> = {
  seedance: "seedance-2",
  veo: "veo-3",
  kling: "kling-video",
  sora: "sora-2",
};

const inputSchema = z.object({
  prompt: z.string().min(2, "Opis je obavezan").max(500),
  imageUrl: z.string().url("Potrebna je URL adresa polazne slike"),
  // Seedance caps a single clip at 15s (longer videos chain clips); Veo caps at 8s.
  durationSec: z.number().int().min(4).max(15).default(5),
  videoModel: z.enum(VIDEO_MODELS).default("seedance"),
  aspectRatio: z.enum(ASPECTS).default("9:16"),
  // Resolution is the dominant cost lever for Seedance/Veo (Kling ignores it).
  resolution: z.enum(RESOLUTIONS).default("720p"),
  /** Optional end frame (start→end transition). */
  endImageUrl: z.string().max(600).default(""),
  bitrateMode: z.enum(["standard", "high"]).default("standard"),
  withAudio: z.boolean().default(true),
});

type Input = z.infer<typeof inputSchema>;

export const cinematicModule: ModuleDef<Input> = {
  slug: "cinematic",
  name: "Cinematic Video",
  tagline: "Slika + opis → kinematski video klip (Seedance / Veo / Kling).",
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
    const input = ctx.inputs;
    // Inject the brand block into the prompt (text-level on-brand). The start
    // frame is the user's image, so visual identity comes from there.
    const prompt = ctx.brandContext?.hasIdentity
      ? `${input.prompt} ${ctx.brandContext.promptBlock}`
      : input.prompt;

    const endImage = input.endImageUrl.trim();
    const endImageUrl = /^https?:\/\//i.test(endImage) ? endImage : undefined;

    // Per-model generation duration + cost basis (settle reconciles against
    // `params`, so reserve == charge for any model/config).
    let reqDuration = input.durationSec;
    let params: UsageParams;
    if (input.videoModel === "veo") {
      reqDuration = veoSnap(input.durationSec);
      params = { durationSec: reqDuration * veoMult(input.resolution, input.withAudio) };
    } else if (input.videoModel === "sora") {
      // Sora 2: flat $0.10/s (audio included), integer duration.
      reqDuration = soraSnap(input.durationSec);
      params = { durationSec: reqDuration };
    } else if (input.videoModel === "kling") {
      params = { durationSec: Math.ceil(input.durationSec * klingMult(input.withAudio)) };
    } else {
      const dims = RESOLUTION_DIMENSIONS[input.resolution] ?? RESOLUTION_DIMENSIONS["720p"];
      params = { durationSec: input.durationSec, width: dims.width, height: dims.height };
    }

    return submitVideoJob(
      ctx,
      MODEL_ID[input.videoModel],
      {
        prompt,
        imageUrl: input.imageUrl,
        durationSec: reqDuration,
        aspectRatio: input.aspectRatio,
        resolution: input.resolution,
        ...(endImageUrl ? { endImageUrl } : {}),
        bitrateMode: input.bitrateMode,
        withAudio: input.withAudio,
      },
      params,
    );
  },
};
