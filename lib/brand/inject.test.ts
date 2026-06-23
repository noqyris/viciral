import { describe, expect, it } from "vitest";
import type { BrandProfile } from "@prisma/client";
import { brandPromptLine, brandReferenceImages, colorsToStrings } from "./inject";

function brand(partial: Partial<BrandProfile>): BrandProfile {
  return {
    id: "b1",
    userId: "u1",
    name: "Acme",
    colors: null,
    voice: null,
    logoUrl: null,
    referenceImages: null,
    fonts: null,
    notes: null,
    isDefault: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...partial,
  };
}

describe("brand injection", () => {
  it("falls back to tone when no brand", () => {
    expect(brandPromptLine(null, "veseo")).toBe("Ton: veseo.");
  });

  it("uses the brand voice over the fallback tone", () => {
    const line = brandPromptLine(brand({ voice: "ozbiljan, stručan" }), "veseo");
    expect(line).toContain("Brend: Acme.");
    expect(line).toContain("Ton glasa: ozbiljan, stručan.");
    expect(line).not.toContain("veseo");
  });

  it("includes colors and notes when present", () => {
    const line = brandPromptLine(
      brand({ colors: ["#111", "#f5f5f5"], notes: "izbegavaj emotikone" }),
      "veseo",
    );
    expect(line).toContain("Boje brenda: #111, #f5f5f5.");
    expect(line).toContain("Napomene o brendu: izbegavaj emotikone.");
  });

  it("ignores non-string color entries", () => {
    expect(colorsToStrings(["#111", 42, null, "  ", "#222"])).toEqual(["#111", "#222"]);
    expect(colorsToStrings("not-an-array")).toEqual([]);
  });

  it("returns brand reference images (http(s) only) for image-to-image", () => {
    expect(brandReferenceImages(null)).toEqual([]);
    expect(brandReferenceImages(brand({ referenceImages: null }))).toEqual([]);
    expect(
      brandReferenceImages(
        brand({ referenceImages: ["https://x/a.png", "javascript:alert(1)", "http://y/b.png"] }),
      ),
    ).toEqual(["https://x/a.png", "http://y/b.png"]);
  });
});
