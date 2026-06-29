import { describe, expect, it } from "vitest";
import { buildSiteHtml, escapeHtml, sanitizeAccent, type SiteImages, type BuildOpts } from "./website-html";
import type { SiteSpec, Section } from "./website";

describe("escapeHtml", () => {
  it("escapes HTML special characters (& first)", () => {
    expect(escapeHtml("<script>\"&'")).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("sanitizeAccent", () => {
  it("passes a valid hex through and rejects CSS injection", () => {
    expect(sanitizeAccent("#1A2B3C")).toBe("#1A2B3C");
    expect(sanitizeAccent("red; } body{}")).toBe("#7c3aed");
    expect(sanitizeAccent("url(javascript:alert(1))")).toBe("#7c3aed");
  });
});

const OPTS: BuildOpts = {
  siteName: "T",
  lang: "sr",
  favicon: "initial",
  year: 2026,
  theme: "auto",
  mode: "auto",
  density: "auto",
  roundness: "auto",
  fontPairing: "auto",
  contentWidth: "auto",
  accentMode: "auto",
  ignoreBrand: false,
};

function spec(sections: Section[], accent = "#112233"): SiteSpec {
  return {
    meta: { title: "T", description: "D", accent, theme: "minimal", navLinks: [] },
    sections,
  };
}
const hero: Section = {
  type: "hero",
  layout: "centered",
  heading: "<b>Hi</b>",
  subheading: "Sub",
  primaryCta: { label: "Go", anchor: "cta" },
};
const footer: Section = { type: "footer", copyright: "F" };
const noImages: SiteImages = { byKey: {} };

describe("buildSiteHtml v2 — safe assembly", () => {
  it("escapes model text (no raw markup injection) and starts with a doctype", () => {
    const html = buildSiteHtml(spec([hero, footer]), noImages, OPTS);
    expect(html).toContain("&lt;b&gt;Hi&lt;/b&gt;");
    expect(html).not.toContain("<b>Hi</b>");
    expect(html.startsWith("<!doctype html>")).toBe(true);
  });

  it("embeds the model accent (a hex) in a style attribute", () => {
    const html = buildSiteHtml(spec([hero, footer]), noImages, OPTS);
    expect(html).toContain("#112233");
  });

  it("only embeds http(s) image URLs", () => {
    const aboutImg: Section = { type: "about", heading: "A", body: "B", imageSide: "right", imagePrompt: "p" };
    const html = buildSiteHtml(spec([hero, aboutImg, footer]), {
      byKey: { hero: "javascript:alert(1)", sec1: "https://example.com/y.png" },
    }, OPTS);
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).toContain("https://example.com/y.png");
  });

  it("falls back to a safe theme accent on an injection attempt", () => {
    const html = buildSiteHtml(spec([hero, footer], "#abc; }x{"), noImages, OPTS);
    expect(html).not.toContain("}x{");
    expect(html).toContain("#18181b"); // minimal theme default accent
  });

  it("drops an unknown section type (enum-gated switch)", () => {
    const bogus = { type: "totally-bogus", heading: "PWNED" } as unknown as Section;
    const html = buildSiteHtml(spec([hero, bogus, footer]), noImages, OPTS);
    expect(html).not.toContain("PWNED");
    expect(html).not.toContain("totally-bogus");
  });

  it("favicon is an encoded data-URI with no raw markup", () => {
    const html = buildSiteHtml(spec([hero, footer]), noImages, OPTS);
    expect(html).toContain("data:image/svg+xml");
    expect(html).not.toContain("<text"); // encodeURIComponent neutralizes the SVG
  });

  it("drops non-http social links but keeps https ones", () => {
    const contact: Section = {
      type: "contact",
      heading: "Kontakt",
      socials: [
        { network: "website", url: "javascript:alert(1)" },
        { network: "instagram", url: "https://instagram.com/acme" },
      ],
    };
    const html = buildSiteHtml(spec([hero, contact, footer]), noImages, OPTS);
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).toContain("https://instagram.com/acme");
  });

  it("renders FAQ with native <details> (no model-authored script)", () => {
    const faq: Section = {
      type: "faq",
      heading: "FAQ",
      items: [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
      ],
    };
    const html = buildSiteHtml(spec([hero, faq, footer]), noImages, OPTS);
    expect(html).toContain("<details");
    // The only <script> in the document is our Tailwind CDN tag.
    expect(html.match(/<script/g)?.length).toBe(1);
  });
});
