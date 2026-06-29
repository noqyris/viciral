import type { ZodType } from "zod";
import { estimateCredits, MODEL_CATALOG } from "@/lib/credits/pricing";
import type { Providers } from "@/lib/providers";
import { extractJson } from "./json";
import type { GenerationMode } from "./types";

/** Auto mode uses the stronger (more expensive) model; manual uses the cheaper one. */
export function pickTextModel(mode: GenerationMode): "claude-opus" | "claude-sonnet" {
  return mode === "auto" ? "claude-opus" : "claude-sonnet";
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
  args: { system: string; prompt: string; maxTokens: number },
): Promise<{ value: T; creditsUsed: number }> {
  const modelId = pickTextModel(ctx.mode);
  const res = await ctx.providers.text.generateText({
    system: args.system,
    prompt: args.prompt,
    model: MODEL_CATALOG[modelId].providerModel,
    maxTokens: args.maxTokens,
  });
  // The model can emit truncated/non-JSON (e.g. when it hits the output-token
  // cap mid-object). Turn the raw SyntaxError into a friendly, retryable error.
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(res.text));
  } catch {
    throw new Error("Model je vratio nevalidan odgovor. Pokušaj ponovo.");
  }
  const value = schema.parse(parsed);
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
