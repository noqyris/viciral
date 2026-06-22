import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/credits/pricing";
import { brandKitModule } from "./brand-kit";

const input = { brandName: "Acme", description: "kafa za mlade", vibe: "moderno" };

describe("brand-kit estimate (reservation upper bound)", () => {
  it("is async-free (sync) and produces a positive estimate", () => {
    expect(brandKitModule.kind).toBeUndefined();
    expect(brandKitModule.estimateCredits(input)).toBeGreaterThan(0);
  });

  it("reserves enough to cover a real run (Sonnet text + 2 images)", () => {
    const estimate = brandKitModule.estimateCredits(input);
    const actual =
      estimateCredits("nano-banana", { numImages: 2 }) +
      estimateCredits("claude-sonnet", { inputTokens: 1800, outputTokens: 1500 });
    expect(estimate).toBeGreaterThanOrEqual(actual);
  });
});
