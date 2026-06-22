import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/credits/pricing";
import { socialPackModule } from "./social-pack";

const input = {
  topic: "test",
  platform: "instagram" as const,
  postCount: 3,
  tone: "neutralan",
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
});
