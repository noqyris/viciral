/**
 * Per-module credit estimates — the single source of truth shared by BOTH the
 * server (a module's `estimateCredits`, used to reserve credits before a run)
 * and the client (the cost hint shown next to the run button). Keeping one
 * function means the number the user sees can never drift from what is reserved.
 *
 * Pure (only imports the pricing math), so it is safe to import in client
 * components and server components alike.
 */
import { estimateCredits, RESOLUTION_DIMENSIONS, veoSnap, soraSnap, veoMult, klingMult } from "./pricing";
import { MODEL_BY_OP } from "@/lib/modules/image-tools";
import { clampInt as intIn } from "@/lib/utils/math";

// Token budgets / image counts per module. These mirror each module's pipeline
// (the `maxTokens` it sends and the images it renders); change them here.
const OPUS_INPUT_TOKENS = 2000;
const SOCIAL_OUTPUT_TOKENS = 2000;
const BRAND_OUTPUT_TOKENS = 2000;
const WEBSITE_INPUT_TOKENS = 2500;
// Single source (imported by website.ts) so the reservation and the module agree.
export const WEBSITE_MAX_SECTION_IMAGES = 4; // hard cap on section images in "all" mode
export const WEBSITE_OUTPUT_BY_LENGTH = { short: 2200, medium: 3000, long: 4200 } as const;
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
      // granularity as the actual charge, so reserve == charge exactly. Images
      // can be turned off (captions only), which removes their cost entirely.
      const includeImage = inputs.includeImage !== false;
      const imagesPerPost = includeImage ? estimateCredits("nano-banana", { numImages: variants }) : 0;
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
    case "website": {
      // Reserve at the MAX images a config can emit (hero + up to N section
      // images), priced with Opus text at the copy-length output cap. Manual runs
      // use the cheaper Sonnet and fewer images → the ledger refunds the rest.
      const imagesMode = typeof inputs.imagesMode === "string" ? inputs.imagesMode : "hero";
      const sections = Array.isArray(inputs.sections) ? inputs.sections : [];
      const copyLength = (["short", "medium", "long"] as const).includes(
        inputs.copyLength as "short" | "medium" | "long",
      )
        ? (inputs.copyLength as "short" | "medium" | "long")
        : "medium";

      const maxHero = imagesMode === "none" ? 0 : 1;
      const maxSections =
        imagesMode !== "all"
          ? 0
          : sections.length > 0
            ? Math.min(
                sections.filter((s) => (s as { image?: unknown })?.image === true).length,
                WEBSITE_MAX_SECTION_IMAGES,
              )
            : WEBSITE_MAX_SECTION_IMAGES;
      const maxImages = maxHero + maxSections;

      return (
        (maxImages > 0 ? estimateCredits("nano-banana", { numImages: maxImages }) : 0) +
        estimateCredits("claude-opus", {
          inputTokens: WEBSITE_INPUT_TOKENS,
          outputTokens: WEBSITE_OUTPUT_BY_LENGTH[copyLength],
        })
      );
    }
    case "cinematic": {
      const durationSec = intIn(inputs.durationSec, 4, 15, 5);
      const vm = inputs.videoModel;
      const videoModel = vm === "veo" || vm === "kling" || vm === "sora" ? vm : "seedance";
      const audio = inputs.withAudio !== false; // default true
      const res = typeof inputs.resolution === "string" ? inputs.resolution : "720p";
      // Veo: $0.20/s base; audio ×2, 4k ×2, 4k+audio ×3. Max 8s/clip.
      if (videoModel === "veo") {
        return estimateCredits("veo-3", { durationSec: veoSnap(durationSec) * veoMult(res, audio) });
      }
      // Sora 2: flat $0.10/s; integer duration 4/8/12.
      if (videoModel === "sora") {
        return estimateCredits("sora-2", { durationSec: soraSnap(durationSec) });
      }
      // Kling: $0.112/s; audio ≈ ×1.5.
      if (videoModel === "kling") {
        return estimateCredits("kling-video", { durationSec: Math.ceil(durationSec * klingMult(audio)) });
      }
      // Seedance: token-billed by pixel area → resolution drives the cost.
      const dims = RESOLUTION_DIMENSIONS[res] ?? RESOLUTION_DIMENSIONS["720p"];
      return estimateCredits("seedance-2", { durationSec, width: dims.width, height: dims.height });
    }
    case "image": {
      const variants = intIn(inputs.variants, 1, 4, 2);
      // Reserve at the CHOSEN image model's price.
      const model =
        inputs.model === "nano-banana-pro" ? "nano-banana-pro" : inputs.model === "gpt-image" ? "gpt-image" : "nano-banana";
      // Optional AI prompt-enhance adds one short text call. Reserve it at Opus
      // (the priciest) so the reservation always covers the actual run (manual
      // uses the cheaper Sonnet, so the unused remainder is refunded).
      const enhance = inputs.enhancePrompt === true;
      return (
        estimateCredits(model, { numImages: variants }) +
        (enhance ? estimateCredits("claude-opus", { inputTokens: 700, outputTokens: 500 }) : 0)
      );
    }
    case "logo": {
      const variants = intIn(inputs.variants, 1, 4, 3);
      return (
        estimateCredits("recraft-vector", { numImages: variants }) +
        estimateCredits("claude-opus", { inputTokens: 1500, outputTokens: 1200 })
      );
    }
    case "app-builder":
      return (
        estimateCredits("nano-banana", { numImages: 3 }) +
        estimateCredits("claude-opus", { inputTokens: 2500, outputTokens: 3500 })
      );
    case "image-tools": {
      const model = MODEL_BY_OP[inputs.operation as keyof typeof MODEL_BY_OP] ?? "bg-removal";
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
      // Lyria 2 — flat per-generation cost (fixed 30s clip).
      return estimateCredits("lyria-2", { numImages: 1 });
    case "voice": {
      // TTS is billed per 1000 chars — reserve at the exact script length.
      const chars = typeof inputs.text === "string" ? inputs.text.length : 0;
      return estimateCredits("elevenlabs-tts", { chars: Math.max(0, chars) });
    }
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
