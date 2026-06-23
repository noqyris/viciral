import { z } from "zod";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { finishSingleAsset } from "./single-asset";
import type { ModuleDef } from "./types";

/**
 * Editor slike — iterative, prompt-driven image editing. One apply = one
 * mask-free edit (Nano Banana edit endpoint): change/add/remove an element,
 * replace the background, or reframe. The runner feeds each result back in as
 * the next input, so users fix an image without re-rolling the whole generation
 * (the "don't pay to regenerate a whole job to tweak one thing" gap).
 *
 * NOTE: this is mask-free (prompt) editing. Region/brush masking is a follow-up
 * that adds a mask image to the same provider call.
 */

const inputSchema = z.object({
  imageUrl: z.string().url("Potrebna je URL slike za izmenu"),
  instruction: z.string().min(2, "Opiši izmenu").max(600),
  aspectRatio: z.enum(["original", "1:1", "4:5", "9:16", "16:9"]).default("original"),
});

type Input = z.infer<typeof inputSchema>;

export const editorModule: ModuleDef<Input> = {
  slug: "editor",
  name: "Editor slike",
  tagline: "Doteruj sliku rečima — izmeni detalj, zameni pozadinu, ponovi po sloj.",
  category: "image",
  status: "available",
  supportsAuto: false,
  icon: "✏️",
  inputSchema,

  estimateCredits(input) {
    return estimateModuleCredits("editor", input as Record<string, unknown>);
  },

  async generate(ctx) {
    const { imageUrl, instruction, aspectRatio } = ctx.inputs;
    const transform = ctx.providers.image.transformImage;
    if (!transform) {
      throw new Error("Provajder slika ne podržava izmene.");
    }

    ctx.onProgress?.("Primenjujem izmenu…");
    const result = await transform({
      modelId: "nano-banana-edit",
      imageUrl,
      prompt: instruction,
      ...(aspectRatio !== "original" ? { aspectRatio } : {}),
    });

    const credits = estimateModuleCredits("editor", ctx.inputs as Record<string, unknown>);
    return finishSingleAsset(
      ctx,
      result.images[0]?.url,
      (url) => ({ kind: "image", url, modelId: "nano-banana-edit", meta: { role: "edit", instruction } }),
      credits,
      "Izmena nije vratila sliku. Pokušaj drugačiju instrukciju.",
    );
  },
};
