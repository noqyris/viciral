import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";
import type { TextProvider, TextRequest, TextResponse } from "./types";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

/** Cheap, high-volume text (captions, copy). */
export const DEFAULT_TEXT_MODEL = "claude-sonnet-4-6";
/** Heavier reasoning / agentic orchestration (auto mode). */
export const ORCHESTRATION_MODEL = "claude-opus-4-8";

export const anthropicProvider: TextProvider = {
  async generateText(req: TextRequest): Promise<TextResponse> {
    const model = req.model ?? DEFAULT_TEXT_MODEL;
    const msg = await getClient().messages.create({
      model,
      max_tokens: req.maxTokens ?? 1024,
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      ...(req.system ? { system: req.system } : {}),
      messages: [{ role: "user", content: req.prompt }],
    });

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
  },
};
