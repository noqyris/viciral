import { describe, expect, it } from "vitest";
import { rewriteEmbeddedUrls } from "./rewrite";

describe("rewriteEmbeddedUrls", () => {
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

  it("no-ops when nothing was persisted (sourceUrl === url)", () => {
    const out = rewriteEmbeddedUrls([
      { kind: "image", sourceUrl: "https://x/a.png", url: "https://x/a.png" },
      { kind: "text", text: "https://x/a.png" },
    ]);
    expect(out[1].text).toBe("https://x/a.png");
  });
});
