import { describe, expect, it } from "vitest";
import { buildAssetKey } from "./r2";

describe("R2 asset keys", () => {
  it("builds a stable, namespaced key per kind", () => {
    expect(buildAssetKey("gen_1", 0, "image")).toBe("generations/gen_1/0-image.png");
    expect(buildAssetKey("gen_1", 2, "video")).toBe("generations/gen_1/2-video.mp4");
  });

  it("falls back to a generic extension for unknown kinds", () => {
    expect(buildAssetKey("gen_1", 0, "mystery")).toBe("generations/gen_1/0-mystery.bin");
  });
});
