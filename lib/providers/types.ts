/**
 * Provider abstraction. Each capability (text / image / video) has a narrow
 * interface so a module step can be routed to fal.ai, Anthropic, or a direct
 * provider, and a step can be re-pointed if a provider's pricing/ToS changes
 * (mitigates platform-dependency risk).
 */

export type ModelKind = "text" | "image" | "video";

// ---- Text ----
export interface TextRequest {
  prompt: string;
  system?: string;
  /** Provider model id (e.g. "claude-sonnet-4-6"). Defaults per adapter. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TextResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
}

export interface TextProvider {
  generateText(req: TextRequest): Promise<TextResponse>;
}

// ---- Image ----
export interface ImageRequest {
  /** Catalog model id (see lib/credits/pricing.ts), e.g. "nano-banana". */
  modelId: string;
  prompt: string;
  numImages?: number;
  aspectRatio?: string;
  /** Reference/edit images (image-to-image). */
  imageUrls?: string[];
}

export interface ImageResponse {
  images: { url: string }[];
  modelId: string;
}

export interface ImageProvider {
  generateImage(req: ImageRequest): Promise<ImageResponse>;
}

// ---- Video (async / queued) ----
export interface VideoRequest {
  modelId: string;
  prompt?: string;
  imageUrl?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  /** Provider posts completion here (fal webhook). */
  webhookUrl?: string;
}

export interface VideoSubmitResponse {
  requestId: string;
  modelId: string;
  status: "queued";
}

export interface VideoResult {
  status: "queued" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface VideoProvider {
  submitVideo(req: VideoRequest): Promise<VideoSubmitResponse>;
  fetchResult(requestId: string, modelId: string): Promise<VideoResult>;
}
