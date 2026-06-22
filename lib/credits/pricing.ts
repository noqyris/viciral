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
export type ModelKind = "text" | "image" | "video";

type CostSpec =
  | { type: "per_image"; usd: number }
  | { type: "per_second"; usd: number }
  | { type: "seedance_tokens"; usdPer1k: number } // tokens = h·w·dur·24/1024
  | { type: "per_mtoken"; inUsd: number; outUsd: number };

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
      const w = p.width ?? 720;
      const h = p.height ?? 1280;
      const dur = p.durationSec ?? 5;
      const tokens = (h * w * dur * 24) / 1024;
      return (tokens / 1000) * model.cost.usdPer1k;
    }
    case "per_mtoken": {
      const inT = p.inputTokens ?? 0;
      const outT = p.outputTokens ?? 0;
      return (inT / 1e6) * model.cost.inUsd + (outT / 1e6) * model.cost.outUsd;
    }
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
