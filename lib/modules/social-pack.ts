import { z } from "zod";
import { estimateCredits } from "@/lib/credits/pricing";
import { DEFAULT_TEXT_MODEL, ORCHESTRATION_MODEL } from "@/lib/providers/anthropic";
import type { GeneratedAsset, ModuleDef } from "./types";

/**
 * Social Media Pack — the flagship module. Theme → a set of posts, each with a
 * caption, hashtags, and a generated image. Optionally a short video (handled
 * asynchronously by the cinematic module / queue in a later phase).
 */

const inputSchema = z.object({
  topic: z.string().min(2, "Tema je obavezna"),
  platform: z.enum(["instagram", "tiktok", "linkedin"]).default("instagram"),
  postCount: z.number().int().min(1).max(10).default(3),
  tone: z.string().default("prijateljski"),
});

type Input = z.infer<typeof inputSchema>;

const planSchema = z.object({
  posts: z
    .array(
      z.object({
        caption: z.string(),
        hashtags: z.array(z.string()),
        imagePrompt: z.string(),
      }),
    )
    .min(1),
});

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

export const socialPackModule: ModuleDef<Input> = {
  slug: "social-pack",
  name: "Social Media Paket",
  tagline: "Tema → set objava (slike + caption + hashtagovi) za IG/TikTok/LinkedIn.",
  category: "social",
  status: "available",
  supportsAuto: true,
  icon: "✨",
  inputSchema,

  estimateCredits(input) {
    const images = estimateCredits("nano-banana", { numImages: input.postCount });
    const text = estimateCredits("claude-sonnet", {
      inputTokens: 1500,
      outputTokens: 400 * input.postCount,
    });
    return images + text;
  },

  async generate(ctx) {
    const input = ctx.inputs;
    ctx.onProgress?.("Planiram sadržaj…");

    const brandLine = ctx.brand
      ? `Brend: ${ctx.brand.name}. Ton glasa: ${ctx.brand.voice ?? input.tone}.`
      : `Ton: ${input.tone}.`;

    const system =
      "Ti si stručnjak za sadržaj na društvenim mrežama. Vrati ISKLJUČIVO validan JSON " +
      'oblika {"posts":[{"caption":string,"hashtags":string[],"imagePrompt":string}]}. ' +
      "imagePrompt piši na engleskom, detaljno, pogodno za AI generator slika.";

    const prompt =
      `Napravi ${input.postCount} objava za ${input.platform} na temu: "${input.topic}". ` +
      brandLine;

    // Auto mode uses the stronger orchestration model; manual uses the cheaper one.
    const model = ctx.mode === "auto" ? ORCHESTRATION_MODEL : DEFAULT_TEXT_MODEL;

    const res = await ctx.providers.text.generateText({
      system,
      prompt,
      model,
      maxTokens: 2000,
    });

    const plan = planSchema.parse(JSON.parse(extractJson(res.text)));

    const assets: GeneratedAsset[] = [];
    let creditsUsed = estimateCredits("claude-sonnet", {
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
    });

    for (let i = 0; i < plan.posts.length; i++) {
      const post = plan.posts[i];
      ctx.onProgress?.(`Generišem sliku ${i + 1}/${plan.posts.length}…`);

      const img = await ctx.providers.image.generateImage({
        modelId: "nano-banana",
        prompt: post.imagePrompt,
        numImages: 1,
      });
      creditsUsed += estimateCredits("nano-banana", { numImages: 1 });

      const hashtags = post.hashtags
        .map((h) => "#" + h.replace(/^#/, ""))
        .join(" ");
      assets.push({
        kind: "text",
        text: `${post.caption}\n\n${hashtags}`,
        meta: { index: i },
      });

      if (img.images[0]) {
        assets.push({
          kind: "image",
          url: img.images[0].url,
          modelId: "nano-banana",
          meta: { index: i, prompt: post.imagePrompt },
        });
      }
    }

    return { assets, creditsUsed };
  },
};
