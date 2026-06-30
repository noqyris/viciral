import { describe, expect, it } from "vitest";
import { estimateModuleCredits } from "./estimate";
import { estimateCredits } from "./pricing";

/**
 * Pure unit tests for the shared per-module credit estimator. No network / fal /
 * anthropic / db — only the pricing math is exercised. Numbers below are derived
 * from the real catalog (lib/credits/pricing.ts) and op mapping
 * (lib/modules/image-tools.ts), so they double as a regression lock on both.
 */
describe("estimateModuleCredits", () => {
  it("returns 0 for an unknown slug", () => {
    expect(estimateModuleCredits("does-not-exist")).toBe(0);
    expect(estimateModuleCredits("does-not-exist", { foo: "bar" })).toBe(0);
  });

  describe("image-tools op → model mapping", () => {
    // image-upscale: $0.03/image × margin 3 = $0.09 → ceil(9) = 9
    it("maps upscale → image-upscale", () => {
      expect(estimateModuleCredits("image-tools", { operation: "upscale" })).toBe(9);
    });

    // nano-banana-edit: $0.0398/image × margin 3 = $0.1194 → ceil(11.94) = 12
    it("maps resize → nano-banana-edit", () => {
      expect(estimateModuleCredits("image-tools", { operation: "resize" })).toBe(12);
    });

    // bg-removal: $0.02/image × margin 3 = $0.06 → ceil(6) = 6
    it("maps bg-remove → bg-removal", () => {
      expect(estimateModuleCredits("image-tools", { operation: "bg-remove" })).toBe(6);
    });

    // Unknown / missing operation falls back to bg-removal (= 6 credits).
    it("falls back to bg-removal for unknown / missing operation", () => {
      expect(estimateModuleCredits("image-tools", { operation: "nope" })).toBe(6);
      expect(estimateModuleCredits("image-tools", {})).toBe(6);
    });
  });

  describe("cinematic duration", () => {
    // 5s @ 720×1280: tokens 108_000 → 1.512 wholesale × 1.3 = 1.9656 → ceil = 197
    const five = estimateModuleCredits("cinematic", { durationSec: 5 });
    // 10s @ 720×1280: tokens 216_000 → 3.024 wholesale × 1.3 = 3.9312 → ceil = 394
    const ten = estimateModuleCredits("cinematic", { durationSec: 10 });

    it("charges the known per-duration credit amounts", () => {
      expect(five).toBe(197);
      expect(ten).toBe(394);
    });

    it("costs more at 10s than at 5s", () => {
      expect(ten).toBeGreaterThan(five);
    });

    it("clamps junk / out-of-range duration (valid 4–15s; longer videos chain clips)", () => {
      // Non-numeric / missing → the 5s default.
      expect(estimateModuleCredits("cinematic", { durationSec: "abc" })).toBe(five);
      expect(estimateModuleCredits("cinematic", {})).toBe(five);
      // 7s is now a real, supported length (not clamped to 5s).
      expect(estimateModuleCredits("cinematic", { durationSec: 7 })).toBeGreaterThan(five);
      // Out-of-range numbers clamp to the nearest bound (4s floor, 15s ceiling).
      expect(estimateModuleCredits("cinematic", { durationSec: 2 })).toBe(
        estimateModuleCredits("cinematic", { durationSec: 4 }),
      );
      expect(estimateModuleCredits("cinematic", { durationSec: 99 })).toBe(
        estimateModuleCredits("cinematic", { durationSec: 15 }),
      );
    });
  });

  describe("dubbing input clamping (no throw)", () => {
    // video-dub: $0.04/s × margin 1.3. Default 30s → 1.2 × 1.3 = 1.56 → ceil = 156.
    it("uses the default 30s when no input is given", () => {
      expect(estimateModuleCredits("dubbing", {})).toBe(156);
    });

    it("clamps out-of-range / junk inputs without throwing", () => {
      // Below the [5,300] floor clamps to 5s: 0.04·5 = 0.2 × 1.3 = 0.26 → 26.
      const min = estimateCredits("video-dub", { durationSec: 5 });
      // Above the ceiling clamps to 300s: 0.04·300 = 12 × 1.3 = 15.6 → 1560.
      const max = estimateCredits("video-dub", { durationSec: 300 });
      expect(() => estimateModuleCredits("dubbing", { approxSeconds: -100 })).not.toThrow();
      expect(estimateModuleCredits("dubbing", { approxSeconds: -100 })).toBe(min);
      expect(estimateModuleCredits("dubbing", { approxSeconds: 99999 })).toBe(max);
      // Non-numeric junk falls back to the 30s default, not NaN.
      expect(estimateModuleCredits("dubbing", { approxSeconds: "junk" })).toBe(156);
    });
  });

  describe("music (Lyria 2 — flat per-generation cost)", () => {
    // Lyria 2: a flat per-generation charge (fixed 30s clip) — duration is ignored.
    const flat = estimateCredits("lyria-2", { numImages: 1 });
    it("is a flat cost regardless of input (duration is fixed)", () => {
      expect(flat).toBeGreaterThan(0);
      expect(estimateModuleCredits("music", {})).toBe(flat);
      expect(estimateModuleCredits("music", { prompt: "x" })).toBe(flat);
      expect(estimateModuleCredits("music", { durationSec: 9999 })).toBe(flat);
    });
  });

  describe("social-pack", () => {
    it("charges (nano-banana per post) + one Opus text pass", () => {
      // Per post: nano-banana 1 image = $0.0398 × 3 = $0.1194 → 12 credits.
      const perPost = estimateCredits("nano-banana", { numImages: 1 });
      expect(perPost).toBe(12);
      // Opus 2000 in / 2000 out: (0.01 + 0.05) = 0.06 × 4 = 0.24 → 24 credits.
      const opus = estimateCredits("claude-opus", { inputTokens: 2000, outputTokens: 2000 });
      expect(opus).toBe(24);
      // 3 posts × 12 + 24 = 60.
      expect(estimateModuleCredits("social-pack", { postCount: 3 })).toBe(3 * perPost + opus);
      expect(estimateModuleCredits("social-pack", { postCount: 3 })).toBe(60);
    });
  });
});
