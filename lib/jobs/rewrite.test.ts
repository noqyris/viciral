import { describe, expect, it } from "vitest";
import { rewriteEmbeddedUrls } from "./rewrite";

describe("rewriteEmbeddedUrls", () => {
  it("no-ops when nothing was persisted (sourceUrl === url)", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://x/a.png", url: "https://x/a.png" },
      { kind: "text", text: "https://x/a.png" },
    ]);
    expect(out[1].text).toBe("https://x/a.png");
  });

  it("no-ops when sourceUrl/url are absent", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image" },
      { kind: "text", text: "see https://prov/a.png here" },
    ]);
    expect(out[1].text).toBe("see https://prov/a.png here");
  });

  it("rewrites raw provider URLs in plain-text assets", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://prov/a.png", url: "https://r2/a.png" },
      { kind: "text", text: "see https://prov/a.png here" },
    ]);
    expect(out[1].text).toBe("see https://r2/a.png here");
  });

  it("rewrites HTML-escaped URLs (query strings with &)", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://prov/a.png?t=1&exp=2", url: "https://r2/a.png" },
      { kind: "text", text: `<img src="https://prov/a.png?t=1&amp;exp=2" />` },
    ]);
    expect(out[1].text).toBe(`<img src="https://r2/a.png" />`);
  });

  it("rewrites both the raw and HTML-escaped form for the same pair", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://prov/a.png?t=1&exp=2", url: "https://r2/a.png" },
      {
        kind: "text",
        text: `raw https://prov/a.png?t=1&exp=2 and escaped https://prov/a.png?t=1&amp;exp=2`,
      },
    ]);
    expect(out[1].text).toBe("raw https://r2/a.png and escaped https://r2/a.png");
  });

  it("leaves non-text (image) assets untouched", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://prov/a.png", url: "https://r2/a.png" },
    ]);
    expect(out[0]).toEqual({
      kind: "image",
      sourceUrl: "https://prov/a.png",
      url: "https://r2/a.png",
    });
  });

  it("handles multiple url pairs in one text asset", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://prov/a.png", url: "https://r2/a.png" },
      { kind: "image", sourceUrl: "https://prov/b.png?x=1&y=2", url: "https://r2/b.png" },
      {
        kind: "text",
        text: `<img src="https://prov/a.png" /><img src="https://prov/b.png?x=1&amp;y=2" />`,
      },
    ]);
    expect(out[2].text).toBe(`<img src="https://r2/a.png" /><img src="https://r2/b.png" />`);
  });
});
