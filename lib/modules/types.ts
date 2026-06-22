import type { ZodType } from "zod";
import type { BrandProfile } from "@prisma/client";
import type { Providers } from "@/lib/providers";
import type { UsageParams } from "@/lib/credits/pricing";

/**
 * A module is an integrated, multi-model workflow (the product's moat).
 * Each module declares its inputs, estimates credits, and runs a `generate`
 * pipeline that orchestrates providers. Adding a module = adding a definition;
 * the hub and runner are generic over {@link ModuleDef}.
 */

export type GenerationMode = "manual" | "auto";

export type ModuleStatus = "available" | "soon";

export interface GeneratedAsset {
  kind: "image" | "video" | "text";
  url?: string;
  text?: string;
  modelId?: string;
  meta?: Record<string, unknown>;
}

export interface ModuleContext<I> {
  userId: string;
  mode: GenerationMode;
  inputs: I;
  brand?: BrandProfile | null;
  providers: Providers;
  /** Optional progress reporting (e.g. for SSE/log). */
  onProgress?: (message: string) => void;
  /**
   * Report credits consumed after each PAID provider step. The runner reserves
   * an upfront estimate and reconciles against the sum reported here, so partial
   * work is charged even if a later step fails.
   */
  spend?: (credits: number) => void;
}

/**
 * Brand memory produced by a module (Brand Kit). The runner upserts it into a
 * BrandProfile so other modules can reuse it — the product's data moat.
 */
export interface BrandProfileDraft {
  name: string;
  voice?: string;
  colors?: string[];
  notes?: string;
}

export interface ModuleResult {
  assets: GeneratedAsset[];
  creditsUsed: number;
  /** When present, the runner saves it as a BrandProfile (with the generated logo). */
  brandProfile?: BrandProfileDraft;
}

/**
 * Returned by an async module's `submit`: a queued provider job whose result
 * arrives later via webhook. `params` lets the webhook compute the actual cost.
 */
export interface SubmitResult {
  requestId: string;
  /** Catalog model id of the async job (for cost calc at settle time). */
  modelId: string;
  params: UsageParams;
}

/** Sync modules complete inline; async modules submit a job and settle via webhook. */
export type ModuleKind = "sync" | "async";

export interface ModuleDef<I = unknown> {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: ModuleStatus;
  /** Defaults to "sync". Async modules implement `submit` instead of `generate`. */
  kind?: ModuleKind;
  /** Whether the module offers a one-click "auto" pipeline (manual is always available). */
  supportsAuto: boolean;
  icon?: string;
  inputSchema: ZodType<I>;
  estimateCredits(inputs: I): number;
  /** Sync modules: run to completion inline. */
  generate?(ctx: ModuleContext<I>): Promise<ModuleResult>;
  /** Async modules: submit a queued job; the webhook settles it. */
  submit?(ctx: ModuleContext<I>): Promise<SubmitResult>;
}
