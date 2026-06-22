import { describe, expect, it } from "vitest";
import { BRAND_LIMITS, clampBrandDraft } from "./normalize";

describe("clampBrandDraft", () => {
  it("caps color count and per-item length, drops empty entries", () => {
    const draft = {
      name: "X",
      colors: [
        ...Array.from({ length: 30 }, () => "#" + "0".repeat(60)),
        "",
        "   ",
      ],
    };
    const out = clampBrandDraft(draft);
    expect(out.colors).toHaveLength(BRAND_LIMITS.colorCount);
    expect(out.colors!.every((c) => c.length <= BRAND_LIMITS.colorLength)).toBe(true);
  });

  it("caps voice and notes length", () => {
    const out = clampBrandDraft({
      name: "X",
      voice: "a".repeat(500),
      notes: "b".repeat(5000),
    });
    expect(out.voice).toHaveLength(BRAND_LIMITS.voice);
    expect(out.notes).toHaveLength(BRAND_LIMITS.notes);
  });

  it("trims/caps the name and drops empty optionals", () => {
    const out = clampBrandDraft({
      name: " " + "n".repeat(200) + " ",
      voice: "   ",
      colors: [],
    });
    expect(out.name).toHaveLength(BRAND_LIMITS.name);
    expect(out.voice).toBeUndefined();
    expect(out.colors).toBeUndefined();
  });
});
