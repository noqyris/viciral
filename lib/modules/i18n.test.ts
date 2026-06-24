import { describe, expect, it } from "vitest";
import { CATEGORY_LABEL, moduleName, moduleTagline } from "./i18n";

const SR_FALLBACK = "Srpski naziv";

describe("moduleName", () => {
  it("returns the English label for a known slug under locale 'en'", () => {
    expect(moduleName("social-pack", "en", SR_FALLBACK)).toBe("Social Media Pack");
    expect(moduleName("music", "en", SR_FALLBACK)).toBe("Music / Soundtrack");
  });

  it("returns the Serbian fallback for locale 'sr'", () => {
    expect(moduleName("social-pack", "sr", SR_FALLBACK)).toBe(SR_FALLBACK);
  });

  it("returns the Serbian fallback for an unknown slug under 'en'", () => {
    expect(moduleName("does-not-exist", "en", SR_FALLBACK)).toBe(SR_FALLBACK);
  });
});

describe("moduleTagline", () => {
  it("returns the English tagline for a known slug under locale 'en'", () => {
    expect(moduleTagline("cinematic", "en", SR_FALLBACK)).toBe(
      "Image + prompt → a cinematic video clip (Seedance).",
    );
  });

  it("returns the Serbian fallback for locale 'sr'", () => {
    expect(moduleTagline("cinematic", "sr", SR_FALLBACK)).toBe(SR_FALLBACK);
  });

  it("returns the Serbian fallback for an unknown slug under 'en'", () => {
    expect(moduleTagline("does-not-exist", "en", SR_FALLBACK)).toBe(SR_FALLBACK);
  });
});

describe("CATEGORY_LABEL", () => {
  it("has both sr and en for every key", () => {
    for (const [key, label] of Object.entries(CATEGORY_LABEL)) {
      expect(typeof label.sr, `${key}.sr`).toBe("string");
      expect(label.sr.length, `${key}.sr`).toBeGreaterThan(0);
      expect(typeof label.en, `${key}.en`).toBe("string");
      expect(label.en.length, `${key}.en`).toBeGreaterThan(0);
    }
  });

  it("covers the expected hub categories", () => {
    expect(Object.keys(CATEGORY_LABEL).sort()).toEqual(
      ["audio", "brand", "image", "social", "video", "web"].sort(),
    );
  });
});
