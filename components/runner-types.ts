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
