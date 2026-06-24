import { describe, expect, it } from "vitest";
import { BRAND_LIMITS, clampBrandDraft, referenceImagesToStrings } from "./normalize";

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

  it("clamps reference images: http(s) only, bounded count", () => {
    const out = clampBrandDraft({
      name: "X",
      referenceImages: [
        "https://a/1.png",
        "ftp://bad/2.png",
        "javascript:alert(1)",
        ...Array.from({ length: 10 }, (_, i) => `https://a/${i}.png`),
      ],
    });
    expect(out.referenceImages!.length).toBeLessThanOrEqual(BRAND_LIMITS.refCount);
    expect(out.referenceImages!.every((u) => /^https?:\/\//.test(u))).toBe(true);
  });

  it("referenceImagesToStrings rejects non-http(s) and over-long URLs", () => {
    expect(referenceImagesToStrings(["https://x/a.png", "javascript:alert(1)", 42, null])).toEqual([
      "https://x/a.png",
    ]);
    expect(referenceImagesToStrings(["https://x/" + "a".repeat(700)])).toEqual([]);
    expect(referenceImagesToStrings("nope")).toEqual([]);
  });

  it("referenceImagesToStrings blocks private/loopback hosts and userinfo (SSRF surface)", () => {
    expect(
      referenceImagesToStrings([
        "https://cdn.example.com/ok.png",
        "http://169.254.169.254/latest/meta-data/", // cloud metadata
        "http://localhost:8080/x.png",
        "http://127.0.0.1/x.png",
        "http://10.0.0.5/x.png",
        "http://192.168.1.10/x.png",
        "http://user:pass@cdn.example.com/x.png", // credentials
        "http://[::1]/x.png", // IPv6 loopback
        "http://[fd00::1]/x.png", // IPv6 unique-local
      ]),
    ).toEqual(["https://cdn.example.com/ok.png"]);
  });

  it("does not mistake public domains starting with fc/fd/fe80 for private IPv6", () => {
    // The IPv6 ULA/link-local prefix check must only apply to IPv6 literals,
    // not to ordinary DNS names that happen to start with those characters.
    expect(
      referenceImagesToStrings([
        "https://fdic.gov/logo.png",
        "https://fcbarcelona.com/crest.png",
        "https://fe80holdings.com/mark.png",
      ]),
    ).toEqual([
      "https://fdic.gov/logo.png",
      "https://fcbarcelona.com/crest.png",
      "https://fe80holdings.com/mark.png",
    ]);
  });
});
