import { describe, expect, it } from "vitest";
import { effortForModel } from "./anthropic";

/**
 * `output_config.effort` support differs by model and a wrong pairing is a hard
 * 400 that fails the whole generation. Both bad pairings are reachable from the
 * UI: "Fast (Haiku)" quality routes to claude-haiku-4-5 (rejects effort), and
 * Sonnet quality + the "xhigh" reasoning-depth option lands on Sonnet 4.6 (xhigh
 * is Opus-only). The gate must drop/clamp these before they reach the API.
 */
describe("effortForModel", () => {
  it("drops effort entirely for Haiku 4.5 (it 400s on the param)", () => {
    expect(effortForModel("claude-haiku-4-5", "high")).toBeUndefined();
    expect(effortForModel("claude-haiku-4-5", "low")).toBeUndefined();
    expect(effortForModel("claude-haiku-4-5", "max")).toBeUndefined();
  });

  it("clamps xhigh to high on Sonnet (xhigh is Opus-only)", () => {
    expect(effortForModel("claude-sonnet-4-6", "xhigh")).toBe("high");
  });

  it("passes through valid Sonnet 4.6 effort levels unchanged", () => {
    expect(effortForModel("claude-sonnet-4-6", "low")).toBe("low");
    expect(effortForModel("claude-sonnet-4-6", "medium")).toBe("medium");
    expect(effortForModel("claude-sonnet-4-6", "high")).toBe("high");
    expect(effortForModel("claude-sonnet-4-6", "max")).toBe("max");
  });

  it("passes through every effort level for Opus (incl. xhigh and max)", () => {
    expect(effortForModel("claude-opus-4-8", "xhigh")).toBe("xhigh");
    expect(effortForModel("claude-opus-4-8", "max")).toBe("max");
    expect(effortForModel("claude-opus-4-8", "low")).toBe("low");
  });

  it("returns undefined when no effort is requested, on any model", () => {
    expect(effortForModel("claude-opus-4-8", undefined)).toBeUndefined();
    expect(effortForModel("claude-sonnet-4-6", undefined)).toBeUndefined();
    expect(effortForModel("claude-haiku-4-5", undefined)).toBeUndefined();
  });
});
