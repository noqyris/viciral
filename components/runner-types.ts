/** Shared shapes for async (queued) generation runners (cinematic/avatar/dubbing). */

export interface RunnerAsset {
  id: string;
  kind: "image" | "video" | "text" | "audio";
  url?: string | null;
  jobStatus?: string | null;
}

export interface AsyncGeneration {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  error?: string | null;
  assets: RunnerAsset[];
}

/** Shared shapes for sync (inline) generation runners (see hooks/use-generation.ts). */
export interface GenerationAsset {
  id?: string;
  kind: "image" | "video" | "text" | "audio";
  url?: string | null;
  text?: string | null;
  meta?: { role?: string; [k: string]: unknown } | null;
}

export interface GenerationResult {
  creditsUsed?: number;
  assets?: GenerationAsset[];
}

export interface GenerationResponse {
  generation?: GenerationResult;
  error?: string;
}
