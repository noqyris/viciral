import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import { estimateCredits } from "@/lib/credits/pricing";
import { socialPackModule } from "./social-pack";

const input = {
  topic: "test",
  platform: "instagram" as const,
  postCount: 3,
  tone: "neutralan",
  variantsPerPost: 1,
};

const PLAN = {
  posts: [
    { caption: "c1", hashtags: ["a"], imagePrompt: "p1" },
    { caption: "c2", hashtags: ["b"], imagePrompt: "p2" },
    { caption: "c3", hashtags: ["c"], imagePrompt: "p3" },
  ],
};

function ctxWith(generateImage: Providers["image"]["generateImage"]) {
  const spent: number[] = [];
  const providers = {
    text: {
      generateText: vi.fn(async () => ({
        text: JSON.stringify(PLAN),
        inputTokens: 100,
        outputTokens: 200,
      })),
    },
    image: { generateImage },
  } as unknown as Providers;
  return {
    spent,
    ctx: {
      userId: "u1",
      mode: "manual" as const,
      inputs: socialPackModule.inputSchema.parse(input),
      brand: null,
      providers,
      spend: (c: number) => spent.push(c),
    },
  };
}

describe("social-pack credit estimate (reservation upper bound)", () => {
  it("reserves enough to cover a real run in manual (Sonnet) and auto (Opus) modes", () => {
    const estimate = socialPackModule.estimateCredits(input);
    const images = estimateCredits("nano-banana", { numImages: input.postCount });

    // Realistic actual text cost with real tokens at/under the 2000 output cap.
    const manualActual =
      images + estimateCredits("claude-sonnet", { inputTokens: 1800, outputTokens: 1500 });
    const autoActual =
      images + estimateCredits("claude-opus", { inputTokens: 1800, outputTokens: 2000 });

    expect(estimate).toBeGreaterThanOrEqual(manualActual);
    expect(estimate).toBeGreaterThanOrEqual(autoActual);
  });

  it("scales the reservation with postCount", () => {
    const e1 = socialPackModule.estimateCredits({ ...input, postCount: 1 });
    const e5 = socialPackModule.estimateCredits({ ...input, postCount: 5 });
    expect(e5).toBeGreaterThan(e1);
  });

  it("reserves images per-post (reserve == charge) and scales with variants", () => {
    // The generate loop spends estimateCredits(nano, {numImages: variants}) PER POST,
    // so the reservation must sum that per post (not a single batch ceil).
    const perPost = estimateCredits("nano-banana", { numImages: 3 });
    const text = estimateCredits("claude-opus", { inputTokens: 2000, outputTokens: 2000 });
    expect(
      socialPackModule.estimateCredits({ ...input, postCount: 10, variantsPerPost: 3 }),
    ).toBe(10 * perPost + text);
    expect(
      socialPackModule.estimateCredits({ ...input, variantsPerPost: 3 }),
    ).toBeGreaterThan(socialPackModule.estimateCredits({ ...input, variantsPerPost: 1 }));
  });
});

describe("social-pack generate (batch resilience)", () => {
  const textCredits = estimateCredits("claude-sonnet", { inputTokens: 100, outputTokens: 200 });
  const perImage = estimateCredits("nano-banana", { numImages: 1 });

  it("keeps every caption and the succeeded images when one image fails mid-batch", async () => {
    let n = 0;
    const { ctx, spent } = ctxWith(
      vi.fn(async () => {
        n += 1;
        if (n === 2) throw new Error("provider 500");
        return { images: [{ url: `https://img/${n}.png` }], modelId: "nano-banana" };
      }),
    );

    const res = await socialPackModule.generate!(ctx);
    const texts = res.assets.filter((a) => a.kind === "text");
    const images = res.assets.filter((a) => a.kind === "image");

    expect(texts).toHaveLength(3); // all captions preserved, even the failed post's
    expect(images).toHaveLength(2); // only the posts whose image came back
    expect(images.map((a) => a.meta?.index)).toEqual([0, 2]); // post 1 (index 1) skipped
    // Text step + 2 delivered images — never the failed one.
    expect(spent).toEqual([textCredits, perImage, perImage]);
    expect(res.creditsUsed).toBe(textCredits + 2 * perImage);
  });

  it("does not charge for a post whose image batch comes back empty", async () => {
    const { ctx, spent } = ctxWith(vi.fn(async () => ({ images: [], modelId: "nano-banana" })));

    const res = await socialPackModule.generate!(ctx);
    expect(res.assets.filter((a) => a.kind === "text")).toHaveLength(3);
    expect(res.assets.filter((a) => a.kind === "image")).toHaveLength(0);
    expect(spent).toEqual([textCredits]); // only the text step — no image charges
    expect(res.creditsUsed).toBe(textCredits);
  });
});
