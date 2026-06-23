import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/credits/pricing";
import { websiteModule } from "./website";

const input = { siteName: "Acme", description: "kafa za mlade", goal: "" };

describe("website estimate (reservation upper bound)", () => {
  it("produces a positive estimate", () => {
    expect(websiteModule.estimateCredits(input)).toBeGreaterThan(0);
  });

  it("covers a real run (Sonnet text + up to 3 images)", () => {
    const estimate = websiteModule.estimateCredits(input);
    const actual =
      estimateCredits("nano-banana", { numImages: 3 }) +
      estimateCredits("claude-sonnet", { inputTokens: 2000, outputTokens: 3000 });
    expect(estimate).toBeGreaterThanOrEqual(actual);
  });
});
