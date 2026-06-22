import type { ZodType } from "zod";
import type { BrandProfile } from "@prisma/client";
import type { Providers } from "@/lib/providers";

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

export interface ModuleResult {
  assets: GeneratedAsset[];
  creditsUsed: number;
}

export interface ModuleDef<I = unknown> {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: ModuleStatus;
  /** Whether the module offers a one-click "auto" pipeline (manual is always available). */
  supportsAuto: boolean;
  icon?: string;
  inputSchema: ZodType<I>;
  estimateCredits(inputs: I): number;
  generate(ctx: ModuleContext<I>): Promise<ModuleResult>;
}
