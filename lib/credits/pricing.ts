/**
 * Model catalog + credit/margin math.
 *
 * Wholesale costs are the provider's price; retail = wholesale × margin.
 * Credits are an internal unit: 1 credit = {@link USD_PER_CREDIT} of retail value.
 *
 * Sources (verified): fal.ai pricing (Nano Banana $0.0398/image; Seedance 2.0
 * token billing $0.014/1k, tokens = h·w·dur·24/1024). Claude API pricing per
 * the claude-api skill model table (Opus 4.8 $5/$25, Sonnet 4.6 $3/$15 per MTok).
 */

export type Provider = "fal" | "anthropic" | "gemini";
export type ModelKind = "text" | "image" | "video" | "audio";

type CostSpec =
  | { type: "per_image"; usd: number }
  | { type: "per_second"; usd: number }
  | { type: "seedance_tokens"; usdPer1k: number } // tokens = h·w·dur·24/1024
  | { type: "per_mtoken"; inUsd: number; outUsd: number }
  | { type: "per_kchar"; usd: number }; // text-to-speech, per 1000 characters

export interface ModelInfo {
  id: string;
  label: string;
  provider: Provider;
  /** Provider-specific endpoint/model id (e.g. fal endpoint or Anthropic model id). */
  providerModel: string;
  kind: ModelKind;
  /** License allows commercial use — only commercial models may be resold. */
  commercial: boolean;
  /** retail = wholesale × margin. */
  margin: number;
  cost: CostSpec;
}

/** 1 credit = $0.01 of retail value. */
export const USD_PER_CREDIT = 0.01;

/** Default vertical (9:16) output resolution for video generation. */
export const VIDEO_DIMENSIONS = { width: 720, height: 1280 } as const;

/**
 * Seedance output dimensions by resolution tier — the cost basis for the
 * token-billed video model (cost scales with pixel area, so resolution is the
 * dominant cost lever). Pixel COUNT is orientation-independent, so these double
 * as the basis regardless of aspect ratio.
 */
export const RESOLUTION_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

export const MODEL_CATALOG: Record<string, ModelInfo> = {
  "nano-banana": {
    id: "nano-banana",
    label: "Nano Banana (Gemini Image)",
    provider: "fal",
    providerModel: "fal-ai/nano-banana",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.0398 },
  },
  // Premium image tier (Gemini 3 Pro Image) — best text rendering + character
  // consistency. Same Gemini input contract as nano-banana (so the fal adapter
  // path is shared). Wholesale ~$0.15/img (4K would be ~2× — not exposed yet);
  // confirm price/license before launch per the whitelist discipline.
  "nano-banana-pro": {
    id: "nano-banana-pro",
    label: "Nano Banana Pro (Gemini 3 Pro Image)",
    provider: "fal",
    providerModel: "fal-ai/nano-banana-pro",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.15 },
  },
  // GPT Image (OpenAI) — best prompt adherence/text. Quality-tiered price; we send
  // quality "medium" and reserve at the conservative "other size" medium rate
  // ($0.063/img) so reserve ≥ charge. Different contract (image_size enum, no
  // aspect_ratio) → its own adapter branch.
  "gpt-image": {
    id: "gpt-image",
    label: "GPT Image (OpenAI)",
    provider: "fal",
    providerModel: "fal-ai/gpt-image-1/text-to-image",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.063 },
  },
  "seedance-2": {
    id: "seedance-2",
    label: "Seedance 2.0 (ByteDance Video)",
    provider: "fal",
    providerModel: "fal-ai/bytedance/seedance-2.0/image-to-video",
    kind: "video",
    commercial: true,
    margin: 1.3, // video is expensive at wholesale → thin margin, premium-gated
    cost: { type: "seedance_tokens", usdPer1k: 0.014 },
  },
  // Veo 3.1 (Google) — verified $0.20/s base (720p/1080p, no audio); audio ×2;
  // 4k ×2; 4k+audio ×3. The cinematic module bills "effective seconds"
  // (durationSec × that multiplier), so this stays a clean per_second base rate.
  "veo-3": {
    id: "veo-3",
    label: "Veo 3.1 (Google Video)",
    provider: "fal",
    providerModel: "fal-ai/veo3.1/image-to-video",
    kind: "video",
    commercial: true,
    margin: 1.3,
    cost: { type: "per_second", usd: 0.2 },
  },
  // Kling 3.0 Pro (Kuaishou) — verified $0.112/s (audio off); audio ×1.5. Same
  // effective-seconds billing pattern. Concurrency = 1/user (queue accordingly).
  "kling-video": {
    id: "kling-video",
    label: "Kling 3.0 (Kuaishou Video)",
    provider: "fal",
    providerModel: "fal-ai/kling-video/v3/pro/image-to-video",
    kind: "video",
    commercial: true,
    margin: 1.3,
    cost: { type: "per_second", usd: 0.112 },
  },
  // Sora 2 (OpenAI) — verified $0.10/s (standard 720p, audio included). duration is
  // an INTEGER enum (4/8/12/16/20). ⚠️ Highest IP/likeness risk; confirm OpenAI/fal
  // COMMERCIAL/reseller terms before launch (the commercial flag here is provisional).
  "sora-2": {
    id: "sora-2",
    label: "Sora 2 (OpenAI Video)",
    provider: "fal",
    providerModel: "fal-ai/sora-2/image-to-video",
    kind: "video",
    commercial: true,
    margin: 1.3,
    cost: { type: "per_second", usd: 0.1 },
  },
  // Lyria 2 (Google music) — verified $0.10 per generation, FIXED 30s, 48kHz WAV.
  // Commercial-licensed on fal.
  "lyria-2": {
    id: "lyria-2",
    label: "Lyria 2 (Google Music)",
    provider: "fal",
    providerModel: "fal-ai/lyria2",
    kind: "audio",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.1 }, // per generation (1 unit)
  },
  "claude-sonnet": {
    id: "claude-sonnet",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    providerModel: "claude-sonnet-4-6",
    kind: "text",
    commercial: true,
    margin: 4,
    cost: { type: "per_mtoken", inUsd: 3, outUsd: 15 },
  },
  "claude-opus": {
    id: "claude-opus",
    label: "Claude Opus 4.8",
    provider: "anthropic",
    providerModel: "claude-opus-4-8",
    kind: "text",
    commercial: true,
    margin: 4,
    cost: { type: "per_mtoken", inUsd: 5, outUsd: 25 },
  },
  "claude-haiku": {
    id: "claude-haiku",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    providerModel: "claude-haiku-4-5",
    kind: "text",
    commercial: true,
    margin: 4,
    cost: { type: "per_mtoken", inUsd: 1, outUsd: 5 },
  },
  // Image post-processing / editing (Faza 5 "Doterivanje"). Wholesale figures are
  // approximate placeholders — confirm each model's price AND commercial license
  // on fal before launch (per the whitelist discipline).
  "nano-banana-edit": {
    id: "nano-banana-edit",
    label: "Nano Banana Edit (Gemini Image edit)",
    provider: "fal",
    providerModel: "fal-ai/nano-banana/edit",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.0398 },
  },
  "bg-removal": {
    id: "bg-removal",
    label: "Background Removal (Bria RMBG)",
    provider: "fal",
    providerModel: "fal-ai/bria/background/remove",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.02 },
  },
  "image-upscale": {
    id: "image-upscale",
    label: "Image Upscaler (Clarity)",
    provider: "fal",
    providerModel: "fal-ai/clarity-upscaler",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.03 },
  },
  // Speech-to-text for the Short-Form Repurposing module (Faza 7). Per-second of
  // media; wholesale is an approximate placeholder — confirm fal's price/license.
  whisper: {
    id: "whisper",
    label: "Whisper (transkripcija)",
    provider: "fal",
    providerModel: "fal-ai/whisper",
    kind: "audio",
    commercial: true,
    margin: 4,
    cost: { type: "per_second", usd: 0.0001 },
  },
  // Talking-head / avatar video (Faza 9). Premium, gated like other video.
  // Wholesale per second is an approximate placeholder — confirm fal price/license.
  "talking-avatar": {
    id: "talking-avatar",
    label: "Talking Avatar (lip-sync video)",
    provider: "fal",
    providerModel: "fal-ai/talking-avatar",
    kind: "video",
    commercial: true,
    margin: 1.3,
    cost: { type: "per_second", usd: 0.05 },
  },
  // Video dubbing / translation with re-synced lips (Faza 11). Placeholder price.
  "video-dub": {
    id: "video-dub",
    label: "Video Dubbing (lokalizacija)",
    provider: "fal",
    providerModel: "fal-ai/video-dubbing",
    kind: "video",
    commercial: true,
    margin: 1.3,
    cost: { type: "per_second", usd: 0.04 },
  },
  // Text-to-speech / voiceover (ElevenLabs via fal). Verified $0.10/1k chars for
  // multilingual-v2 (turbo-v2.5 is $0.05/1k). Per the whitelist discipline,
  // confirm commercial license before launch.
  "elevenlabs-tts": {
    id: "elevenlabs-tts",
    label: "ElevenLabs (voiceover)",
    provider: "fal",
    providerModel: "fal-ai/elevenlabs/tts/multilingual-v2",
    kind: "audio",
    commercial: true,
    margin: 4,
    cost: { type: "per_kchar", usd: 0.1 },
  },
  // Music / soundtrack generation (Faza 14). Placeholder price.
  "music-gen": {
    id: "music-gen",
    label: "Music Generator",
    provider: "fal",
    providerModel: "fal-ai/stable-audio",
    kind: "audio",
    commercial: true,
    margin: 3,
    cost: { type: "per_second", usd: 0.002 },
  },
  // Video-chain utilities (arbitrary-length video = chained Seedance clips).
  // extract-frame pulls the last frame to seed the next clip; merge-videos stitches
  // the clips into one. Wholesale figures are approximate placeholders — confirm
  // fal's ffmpeg-api pricing/license before launch (per the whitelist discipline).
  "ffmpeg-extract-frame": {
    id: "ffmpeg-extract-frame",
    label: "Frame extract (ffmpeg)",
    provider: "fal",
    providerModel: "fal-ai/ffmpeg-api/extract-frame",
    kind: "video",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.005 },
  },
  "ffmpeg-merge": {
    id: "ffmpeg-merge",
    label: "Video merge (ffmpeg)",
    provider: "fal",
    providerModel: "fal-ai/ffmpeg-api/merge-videos",
    kind: "video",
    commercial: true,
    margin: 3,
    cost: { type: "per_second", usd: 0.0005 },
  },
  // Vector logo / SVG (Faza 12 — Brand Kit credibility). Placeholder price.
  "recraft-vector": {
    id: "recraft-vector",
    label: "Recraft Vector (SVG logo)",
    provider: "fal",
    providerModel: "fal-ai/recraft/v4/text-to-vector",
    kind: "image",
    commercial: true,
    margin: 3,
    cost: { type: "per_image", usd: 0.08 },
  },
};

/** Returns a model from the catalog, enforcing the commercial-license whitelist. */
export function getModel(id: string): ModelInfo {
  const model = MODEL_CATALOG[id];
  if (!model) throw new Error(`Unknown model: ${id}`);
  if (!model.commercial) {
    throw new Error(`Model ${id} is not licensed for commercial use`);
  }
  return model;
}

export interface UsageParams {
  numImages?: number;
  durationSec?: number;
  width?: number;
  height?: number;
  inputTokens?: number;
  outputTokens?: number;
  /** Character count for per-1000-character text-to-speech pricing. */
  chars?: number;
}

/** Provider's wholesale cost in USD for the given usage. */
export function estimateWholesaleUsd(id: string, p: UsageParams): number {
  const model = getModel(id);
  switch (model.cost.type) {
    case "per_image":
      return model.cost.usd * (p.numImages ?? 1);
    case "per_second":
      return model.cost.usd * (p.durationSec ?? 5);
    case "seedance_tokens": {
      const w = p.width ?? VIDEO_DIMENSIONS.width;
      const h = p.height ?? VIDEO_DIMENSIONS.height;
      const dur = p.durationSec ?? 5;
      const tokens = (h * w * dur * 24) / 1024;
      return (tokens / 1000) * model.cost.usdPer1k;
    }
    case "per_mtoken": {
      const inT = p.inputTokens ?? 0;
      const outT = p.outputTokens ?? 0;
      return (inT / 1e6) * model.cost.inUsd + (outT / 1e6) * model.cost.outUsd;
    }
    case "per_kchar":
      return model.cost.usd * ((p.chars ?? 0) / 1000);
  }
}

/** Credits charged to the user for a given wholesale cost (margin applied). */
export function wholesaleToCredits(id: string, wholesaleUsd: number): number {
  const model = getModel(id);
  return Math.ceil((wholesaleUsd * model.margin) / USD_PER_CREDIT);
}

/** Estimated credits for the given usage (wholesale × margin → credits). */
export function estimateCredits(id: string, p: UsageParams): number {
  return wholesaleToCredits(id, estimateWholesaleUsd(id, p));
}
