import { describe, expect, it } from "vitest";
import {
  estimateCredits,
  estimateWholesaleUsd,
  getModel,
  wholesaleToCredits,
} from "./pricing";

describe("pricing / credit math", () => {
  it("prices a Nano Banana image (wholesale × margin → credits)", () => {
    // wholesale 0.0398 × 3 margin = 0.1194 retail → ceil(0.1194 / 0.01) = 12
    expect(estimateWholesaleUsd("nano-banana", { numImages: 1 })).toBeCloseTo(0.0398);
    expect(estimateCredits("nano-banana", { numImages: 1 })).toBe(12);
    expect(estimateCredits("nano-banana", { numImages: 4 })).toBe(48);
  });

  it("applies the Seedance token formula: (h·w·dur·24)/1024", () => {
    // 720×1280, 5s → 108_000 tokens → 108 × 0.014 = 1.512 wholesale
    const wholesale = estimateWholesaleUsd("seedance-2", {
      width: 720,
      height: 1280,
      durationSec: 5,
    });
    expect(wholesale).toBeCloseTo(1.512, 3);
    // × 1.3 margin = 1.9656 → ceil(196.56) = 197 credits
    expect(estimateCredits("seedance-2", { width: 720, height: 1280, durationSec: 5 })).toBe(197);
  });

  it("prices Claude text per million tokens", () => {
    // Sonnet $3/$15: (1500/1e6)·3 + (1200/1e6)·15 = 0.0225 wholesale × 4 = 0.09 → 9 credits
    expect(estimateCredits("claude-sonnet", { inputTokens: 1500, outputTokens: 1200 })).toBe(9);
  });

  it("rounds credits up so we never undercharge", () => {
    expect(wholesaleToCredits("nano-banana", 0.001)).toBe(1);
  });

  it("rejects unknown models", () => {
    expect(() => getModel("does-not-exist")).toThrow(/Unknown model/);
  });
});
