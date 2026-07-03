import type { ZodType } from "zod";
import { estimateCredits, MODEL_CATALOG } from "@/lib/credits/pricing";
import type { Providers } from "@/lib/providers";
import { extractJson } from "./json";
import type { GenerationMode } from "./types";

export type TextModelKey = "claude-opus" | "claude-sonnet" | "claude-haiku";
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/** "#" -prefix each tag (dedup any existing "#") and space-join. */
export function formatHashtags(tags: string[]): string {
  return tags.map((h) => "#" + h.replace(/^#/, "")).join(" ");
}

/** Auto mode uses the stronger (more expensive) model; manual uses the cheaper one. */
export function pickTextModel(mode: GenerationMode): "claude-opus" | "claude-sonnet" {
  return mode === "auto" ? "claude-opus" : "claude-sonnet";
}

/**
 * Maps a user "quality" preset to a catalog model key. Auto mode always uses Opus
 * (the premium "do it all for me" path), regardless of the preset.
 */
export function modelForQuality(quality: string | undefined, mode: GenerationMode): TextModelKey {
  if (mode === "auto") return "claude-opus";
  return quality === "fast" ? "claude-haiku" : quality === "best" ? "claude-opus" : "claude-sonnet";
}

interface TextCtx {
  mode: GenerationMode;
  providers: Providers;
  spend?: (credits: number) => void;
}

/**
 * Runs the text model, parses its JSON output against `schema`, and reports the
 * text credits via `ctx.spend`. Centralizes the model-by-mode policy and the
 * model↔pricing coupling so the cost can never drift from the model actually run.
 */
export async function runJsonText<T>(
  ctx: TextCtx,
  schema: ZodType<T>,
  args: {
    system: string;
    prompt: string;
    maxTokens: number;
    /** Explicit catalog model id (wins over `quality`). */
    model?: TextModelKey;
    /** User quality preset → model via `modelForQuality` (auto mode forces Opus). */
    quality?: string;
    effort?: Effort;
  },
): Promise<{ value: T; creditsUsed: number }> {
  const modelId =
    args.model ??
    (args.quality !== undefined ? modelForQuality(args.quality, ctx.mode) : pickTextModel(ctx.mode));
  const res = await ctx.providers.text.generateText({
    system: args.system,
    prompt: args.prompt,
    model: MODEL_CATALOG[modelId].providerModel,
    maxTokens: args.maxTokens,
    ...(args.effort ? { effort: args.effort } : {}),
  });
  // The model can emit truncated/non-JSON (SyntaxError) or valid JSON of the
  // wrong shape (ZodError) — e.g. when it hits the output-token cap mid-object.
  // Turn either into the same friendly, retryable error rather than surfacing a
  // raw parser/validation stack to the user.
  let value: T;
  try {
    value = schema.parse(JSON.parse(extractJson(res.text)));
  } catch {
    throw new Error("Model je vratio nevalidan odgovor. Pokušaj ponovo.");
  }
  const creditsUsed = estimateCredits(modelId, {
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
  });
  ctx.spend?.(creditsUsed);
  return { value, creditsUsed };
}

/**
 * Runs the text model for a PLAIN-text result (no JSON parse) and reports credits
 * via `ctx.spend`. Used for short helper steps like prompt enhancement, where we
 * want the model's prose directly. Same model-by-mode policy as {@link runJsonText}.
 */
export async function runText(
  ctx: TextCtx,
  args: { system: string; prompt: string; maxTokens: number },
): Promise<{ text: string; creditsUsed: number }> {
  const modelId = pickTextModel(ctx.mode);
  const res = await ctx.providers.text.generateText({
    system: args.system,
    prompt: args.prompt,
    model: MODEL_CATALOG[modelId].providerModel,
    maxTokens: args.maxTokens,
  });
  const creditsUsed = estimateCredits(modelId, {
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
  });
  ctx.spend?.(creditsUsed);
  return { text: res.text.trim(), creditsUsed };
}
