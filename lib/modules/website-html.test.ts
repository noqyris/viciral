import { describe, expect, it } from "vitest";
import { buildSiteHtml, escapeHtml, sanitizeAccent } from "./website-html";

describe("escapeHtml", () => {
  it("escapes HTML special characters (& first)", () => {
    expect(escapeHtml("<script>\"&'")).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("sanitizeAccent", () => {
  it("passes a valid hex color through", () => {
    expect(sanitizeAccent("#1A2B3C")).toBe("#1A2B3C");
    expect(sanitizeAccent("#abc")).toBe("#abc");
  });
  it("rejects CSS-injection attempts and uses the safe fallback", () => {
    expect(sanitizeAccent("red; } body{display:none}")).toBe("#7c3aed");
    expect(sanitizeAccent("url(javascript:alert(1))")).toBe("#7c3aed");
  });
});

describe("buildSiteHtml", () => {
  const spec = {
    title: "T",
    tagline: "Tag",
    accent: "#112233",
    hero: { heading: "<b>Hi</b>", subheading: "Sub", ctaText: "Go" },
    sections: [
      { heading: "S1", body: "B1" },
      { heading: "S2", body: "B2" },
    ],
    footer: "F",
  };

  it("escapes model text (no raw markup injection) and embeds the accent", () => {
    const html = buildSiteHtml(spec, { sectionUrls: [] });
    expect(html).toContain("&lt;b&gt;Hi&lt;/b&gt;");
    expect(html).not.toContain("<b>Hi</b>");
    expect(html).toContain("#112233");
    expect(html.startsWith("<!doctype html>")).toBe(true);
  });

  it("only embeds http(s) image URLs", () => {
    const html = buildSiteHtml(spec, {
      heroUrl: "javascript:alert(1)",
      sectionUrls: ["https://example.com/y.png"],
    });
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).toContain("https://example.com/y.png");
  });

  it("falls back to a safe accent on injection attempts", () => {
    const html = buildSiteHtml({ ...spec, accent: "#abc; }x{" }, { sectionUrls: [] });
    expect(html).toContain("#7c3aed");
    expect(html).not.toContain("}x{");
  });
});
