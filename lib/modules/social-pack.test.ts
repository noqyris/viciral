import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/credits/pricing";
import { socialPackModule } from "./social-pack";

const input = {
  topic: "test",
  platform: "instagram" as const,
  postCount: 3,
  tone: "neutralan",
  variantsPerPost: 1,
};

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
