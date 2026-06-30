import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";
import type { TextProvider, TextRequest, TextResponse } from "./types";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries on transient Anthropic errors (5xx / 529 overloaded) with exponential
 * backoff. Overload blips are common and retryable; a one-off 500 shouldn't fail
 * a whole generation.
 */
async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const retryable = typeof status === "number" && status >= 500;
      if (!retryable || i >= tries - 1) throw err;
      await sleep(600 * 2 ** i); // 0.6s, 1.2s, 2.4s
    }
  }
}

/** Cheap, high-volume text (captions, copy). */
export const DEFAULT_TEXT_MODEL = "claude-sonnet-4-6";
/** Heavier reasoning / agentic orchestration (auto mode). */
export const ORCHESTRATION_MODEL = "claude-opus-4-8";

/**
 * Resolves `output_config.effort` to a value the target model actually accepts.
 * Haiku 4.5 rejects the effort param outright (400), and `xhigh` is Opus-only —
 * Sonnet 4.6 accepts low/medium/high/max but 400s on `xhigh`. Without this gate,
 * a user picking "Fast (Haiku)" quality (or Sonnet quality + max reasoning) plus
 * a reasoning-depth value would fail the whole generation. Returns undefined to
 * omit the field, in which case the model defaults to `high`.
 */
export function effortForModel(
  model: string,
  effort: TextRequest["effort"],
): TextRequest["effort"] {
  if (!effort) return undefined;
  if (model === "claude-haiku-4-5") return undefined; // effort 400s on Haiku 4.5
  if (effort === "xhigh" && !model.startsWith("claude-opus")) return "high"; // xhigh is Opus-only
  return effort;
}

export const anthropicProvider: TextProvider = {
  async generateText(req: TextRequest): Promise<TextResponse> {
    const primary = req.model ?? DEFAULT_TEXT_MODEL;
    // On sustained overload of the cheaper model, fall back to Opus. The
    // reservation already prices text at Opus (the conservative upper bound), so
    // this never exceeds the reserved budget.
    const chain =
      primary === ORCHESTRATION_MODEL ? [primary] : [primary, ORCHESTRATION_MODEL];

    let lastErr: unknown;
    for (let m = 0; m < chain.length; m++) {
      const model = chain[m];
      const effort = effortForModel(model, req.effort);
      try {
        const msg = await withRetry(() =>
          getClient().messages.create({
            model,
            max_tokens: req.maxTokens ?? 1024,
            // temperature/top_p are rejected (400) on Opus 4.x — only honor them on
            // the cheaper Sonnet/Haiku tiers (and never on the Opus fallback).
            ...(req.temperature !== undefined && model !== ORCHESTRATION_MODEL
              ? { temperature: req.temperature }
              : {}),
            ...(effort ? { output_config: { effort } } : {}),
            ...(req.stopSequences?.length ? { stop_sequences: req.stopSequences } : {}),
            ...(req.system ? { system: req.system } : {}),
            messages: [{ role: "user", content: req.prompt }],
          }),
        );

        const text = msg.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n");

        return {
          text,
          inputTokens: msg.usage.input_tokens,
          outputTokens: msg.usage.output_tokens,
          modelId: model,
        };
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number })?.status;
        const transient = typeof status === "number" && status >= 500;
        if (!transient || m === chain.length - 1) throw err;
        // transient overload on the cheaper model → try the next model in the chain
      }
    }
    throw lastErr;
  },
};
