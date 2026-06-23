import type { GeneratedAsset, ModuleContext, ModuleResult } from "./types";

/**
 * Shared tail for single-asset sync modules (image-tools / editor / music). If
 * the provider returned no usable URL, throw BEFORE spending so the runner
 * refunds the reservation — never charge for a no-op. Otherwise spend exactly the
 * reserved credits and return the single asset. Centralizes the subtle
 * throw-before-spend / reserve==charge invariant in one place.
 */
export function finishSingleAsset(
  ctx: Pick<ModuleContext<unknown>, "spend">,
  url: string | undefined | null,
  makeAsset: (url: string) => GeneratedAsset,
  credits: number,
  emptyError: string,
): ModuleResult {
  if (!url) throw new Error(emptyError);
  ctx.spend?.(credits);
  return { assets: [makeAsset(url)], creditsUsed: credits };
}
