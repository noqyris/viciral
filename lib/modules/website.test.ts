import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/credits/pricing";
import { websiteModule } from "./website";

const base = { siteName: "Acme", description: "kafa za mlade" };
const est = (extra: Record<string, unknown> = {}) =>
  websiteModule.estimateCredits(websiteModule.inputSchema.parse({ ...base, ...extra }));

const opusMedium = estimateCredits("claude-opus", { inputTokens: 2500, outputTokens: 3000 });

describe("website estimate (reservation upper bound)", () => {
  it("produces a positive estimate", () => {
    expect(est()).toBeGreaterThan(0);
  });

  it("default (images=hero) covers a real Sonnet run + 1 hero image", () => {
    const actual =
      estimateCredits("nano-banana", { numImages: 1 }) +
      estimateCredits("claude-sonnet", { inputTokens: 2000, outputTokens: 3000 });
    expect(est()).toBeGreaterThanOrEqual(actual);
  });

  it("images=all reserves the hero + the section-image cap", () => {
    const actual =
      estimateCredits("nano-banana", { numImages: 5 }) + // 1 hero + 4 section cap
      estimateCredits("claude-sonnet", { inputTokens: 2000, outputTokens: 3000 });
    expect(est({ imagesMode: "all" })).toBeGreaterThanOrEqual(actual);
  });

  it("images=none reserves text only (no image credits)", () => {
    expect(est({ imagesMode: "none" })).toBe(opusMedium);
  });

  it("longer copy reserves more text than shorter", () => {
    expect(est({ copyLength: "long", imagesMode: "none" })).toBeGreaterThan(
      est({ copyLength: "short", imagesMode: "none" }),
    );
  });
});
