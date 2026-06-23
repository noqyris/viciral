import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { finishSingleAsset } from "./single-asset";
import type { ModuleDef } from "./types";

/**
 * Image Tools ("Doterivanje slike") — single-image utilities that make a
 * generated or uploaded asset ship-ready: remove the background, upscale to high
 * resolution, or reframe to a new aspect ratio. Each op is one fal transform
 * behind the image provider, so a step can be re-pointed if pricing/ToS changes.
 */

const OPERATIONS = ["bg-remove", "upscale", "resize"] as const;
type Operation = (typeof OPERATIONS)[number];

const ASPECT_RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;

const inputSchema = z.object({
  imageUrl: z.string().url("Potrebna je URL adresa slike"),
  operation: z.enum(OPERATIONS).default("bg-remove"),
  aspectRatio: z.enum(ASPECT_RATIOS).default("9:16"),
});

type Input = z.infer<typeof inputSchema>;

const MODEL_BY_OP: Record<Operation, string> = {
  "bg-remove": "bg-removal",
  upscale: "image-upscale",
  resize: "nano-banana-edit",
};

const PROGRESS: Record<Operation, string> = {
  "bg-remove": "Uklanjam pozadinu…",
  upscale: "Povećavam rezoluciju…",
  resize: "Prilagođavam format…",
};

export const imageToolsModule: ModuleDef<Input> = {
  slug: "image-tools",
  name: "Doterivanje slike",
  tagline: "Ukloni pozadinu, povećaj rezoluciju ili promeni format slike.",
  category: "image",
  status: "available",
  supportsAuto: false,
  icon: "🪄",
  inputSchema,

  estimateCredits(input) {
    return estimateModuleCredits("image-tools", input as Record<string, unknown>);
  },

  async generate(ctx) {
    const { imageUrl, operation, aspectRatio } = ctx.inputs;
    const transform = ctx.providers.image.transformImage;
    if (!transform) {
      throw new Error("Provajder slika ne podržava doterivanje.");
    }

    ctx.onProgress?.(PROGRESS[operation]);
    const modelId = MODEL_BY_OP[operation];

    const result = await transform({
      modelId,
      imageUrl,
      // Only the resize/edit model takes a prompt; bg-removal/upscale are prompt-less.
      ...(operation === "resize"
        ? {
            prompt:
              `Reframe and extend this image to a ${aspectRatio} aspect ratio. ` +
              "Keep the main subject fully visible and centered; do not crop or distort it. " +
              "Preserve the original style, lighting and colors; outpaint natural background where needed.",
            aspectRatio,
          }
        : {}),
    });

    // Charge exactly what was reserved for this op (single source of truth).
    const credits = estimateModuleCredits("image-tools", { operation });
    return finishSingleAsset(
      ctx,
      result.images[0]?.url,
      (url) => ({ kind: "image", url, modelId, meta: { operation, aspectRatio } }),
      credits,
      "Obrada nije vratila sliku. Pokušaj ponovo.",
    );
  },
};
