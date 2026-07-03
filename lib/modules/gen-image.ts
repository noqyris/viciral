import type { ModuleContext } from "./types";

/**
 * Best-effort brand image for the assembly modules (website / app-builder):
 * generate one Nano Banana image with the brand reference images, charge only
 * when a URL actually comes back, and degrade to "no image" on any failure
 * (a single provider error must not sink the — already paid for — page). Returns
 * the URL (if any) and the credits spent, so callers accumulate identically.
 */
export async function genBrandImage(
  ctx: Pick<ModuleContext<unknown>, "providers" | "spend">,
  prompt: string,
  opts: { referenceImages: string[]; credits: number; label: string },
): Promise<{ url?: string; spent: number }> {
  try {
    const res = await ctx.providers.image.generateImage({
      modelId: "nano-banana",
      prompt,
      numImages: 1,
      ...(opts.referenceImages.length ? { imageUrls: opts.referenceImages } : {}),
    });
    const url = res.images[0]?.url;
    if (!url) return { spent: 0 };
    ctx.spend?.(opts.credits);
    return { url, spent: opts.credits };
  } catch (err) {
    console.error(`${opts.label}: image generation failed (continues):`, err);
    return { spent: 0 };
  }
}
