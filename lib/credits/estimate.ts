/**
 * Per-module credit estimates — the single source of truth shared by BOTH the
 * server (a module's `estimateCredits`, used to reserve credits before a run)
 * and the client (the cost hint shown next to the run button). Keeping one
 * function means the number the user sees can never drift from what is reserved.
 *
 * Pure (only imports the pricing math), so it is safe to import in client
 * components and server components alike.
 */
import { estimateCredits } from "./pricing";
import { clampInt as intIn } from "@/lib/utils/math";

// Token budgets / image counts per module. These mirror each module's pipeline
// (the `maxTokens` it sends and the images it renders); change them here.
const OPUS_INPUT_TOKENS = 2000;
const SOCIAL_OUTPUT_TOKENS = 2000;
const BRAND_OUTPUT_TOKENS = 2000;
const WEBSITE_INPUT_TOKENS = 2500;
const WEBSITE_OUTPUT_TOKENS = 3000;
const WEBSITE_IMAGES = 3; // hero + up to 2 sections
const VIDEO_WIDTH = 720;
const VIDEO_HEIGHT = 1280;
// Talking-head length is driven by the script (~150 wpm ≈ 2.5 words/sec), clamped.
const AVATAR_MIN_SEC = 3;
const AVATAR_MAX_SEC = 120;

/** Estimated talking-head duration (seconds) from a script — shared by the
 * reservation and the submit params so cost can't drift from what is generated. */
export function avatarScriptSeconds(script: string): number {
  const words = (script || "").trim().split(/\s+/).filter(Boolean).length;
  const sec = Math.ceil(words / 2.5);
  return Math.min(AVATAR_MAX_SEC, Math.max(AVATAR_MIN_SEC, sec));
}
// Short-form clip scoring: bounded transcript in + clip plan out. The transcript
// char cap is the SINGLE SOURCE (short-form.ts imports it) so the reservation and
// the real prompt can't drift. Serbian-Latin tokenizes densely (~2.2 chars/token
// floor), so we reserve ceil((cap + prose)/2.2) input tokens — a true upper bound
// (reserve >= actual charge) even for a full, dense, Cyrillic-heavy transcript.
export const SHORTFORM_TRANSCRIPT_CHARS = 16000;
const SHORTFORM_INPUT_TOKENS = Math.ceil((SHORTFORM_TRANSCRIPT_CHARS + 800) / 2.2);
const SHORTFORM_OUTPUT_TOKENS = 2500;

/**
 * Estimated credits for running `slug` with the given (possibly partial) inputs.
 * Unknown / missing fields fall back to the module's defaults, so this is safe
 * to call with in-progress form state.
 */
export function estimateModuleCredits(
  slug: string,
  inputs: Record<string, unknown> = {},
): number {
  switch (slug) {
    case "social-pack": {
      const postCount = intIn(inputs.postCount, 1, 10, 3);
      const variants = intIn(inputs.variantsPerPost, 1, 3, 1);
      // Sum per-post (the generate loop spends once PER POST) — same rounding
      // granularity as the actual charge, so reserve == charge exactly.
      const imagesPerPost = estimateCredits("nano-banana", { numImages: variants });
      return (
        postCount * imagesPerPost +
        estimateCredits("claude-opus", {
          inputTokens: OPUS_INPUT_TOKENS,
          outputTokens: SOCIAL_OUTPUT_TOKENS,
        })
      );
    }
    case "brand-kit":
      return (
        // avatar (raster, Nano Banana) + logo (vector, Recraft) + identity text.
        estimateCredits("nano-banana", { numImages: 1 }) +
        estimateCredits("recraft-vector", { numImages: 1 }) +
        estimateCredits("claude-opus", {
          inputTokens: OPUS_INPUT_TOKENS,
          outputTokens: BRAND_OUTPUT_TOKENS,
        })
      );
    case "website":
      return (
        estimateCredits("nano-banana", { numImages: WEBSITE_IMAGES }) +
        estimateCredits("claude-opus", {
          inputTokens: WEBSITE_INPUT_TOKENS,
          outputTokens: WEBSITE_OUTPUT_TOKENS,
        })
      );
    case "cinematic": {
      const durationSec = Number(inputs.durationSec) === 10 ? 10 : 5;
      return estimateCredits("seedance-2", {
        durationSec,
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
      });
    }
    case "image-tools": {
      const op = inputs.operation;
      const model =
        op === "upscale" ? "image-upscale" : op === "resize" ? "nano-banana-edit" : "bg-removal";
      return estimateCredits(model, { numImages: 1 });
    }
    case "editor":
      // One prompt-driven edit per apply (iterative editor chains many).
      return estimateCredits("nano-banana-edit", { numImages: 1 });
    case "avatar":
      return estimateCredits("talking-avatar", {
        durationSec: avatarScriptSeconds(String(inputs.script ?? "")),
      });
    case "dubbing":
      return estimateCredits("video-dub", { durationSec: intIn(inputs.approxSeconds, 5, 300, 30) });
    case "music":
      return estimateCredits("music-gen", { durationSec: intIn(inputs.durationSec, 5, 120, 20) });
    case "short-form": {
      const minutes = intIn(inputs.approxMinutes, 1, 60, 10);
      return (
        estimateCredits("whisper", { durationSec: minutes * 60 }) +
        estimateCredits("claude-opus", { inputTokens: SHORTFORM_INPUT_TOKENS, outputTokens: SHORTFORM_OUTPUT_TOKENS })
      );
    }
    default:
      return 0;
  }
}
