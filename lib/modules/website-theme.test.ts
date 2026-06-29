import { describe, expect, it } from "vitest";
import {
  resolveTheme,
  ctaTextColor,
  faviconDataUri,
  contrastRatio,
  type ThemeOptions,
} from "./website-theme";

const base: ThemeOptions = {
  theme: "auto",
  mode: "auto",
  density: "auto",
  roundness: "auto",
  fontPairing: "auto",
  contentWidth: "auto",
  accentMode: "auto",
  ignoreBrand: false,
};

describe("resolveTheme — accent precedence + safety", () => {
  it("a custom accent wins and is normalized to #rrggbb", () => {
    expect(resolveTheme({ ...base, accentMode: "custom", accentColor: "#f00" }).accent).toBe("#ff0000");
  });

  it("an injection accent falls back to the theme's literal default", () => {
    const t = resolveTheme({ ...base, theme: "minimal", accentMode: "custom", accentColor: "red; }x{" });
    expect(t.accent).toBe("#18181b");
    expect(t.accent).not.toContain("}");
  });

  it("uses the brand color in brand mode, but ignoreBrand skips it", () => {
    expect(resolveTheme({ ...base, accentMode: "brand", brandColor: "#00ff00" }).accent).toBe("#00ff00");
    expect(
      resolveTheme({ ...base, accentMode: "brand", brandColor: "#00ff00", ignoreBrand: true, modelAccent: "#0000ff" })
        .accent,
    ).toBe("#0000ff");
  });

  it("auto mode follows the theme's dark preference (bold → dark)", () => {
    expect(resolveTheme({ ...base, theme: "bold", mode: "auto" }).mode).toBe("dark");
    expect(resolveTheme({ ...base, theme: "minimal", mode: "auto" }).mode).toBe("light");
  });

  it("an out-of-enum option resolves to a safe token (never undefined)", () => {
    const t = resolveTheme({ ...base, density: "bogus", roundness: "bogus", contentWidth: "bogus", fontPairing: "bogus" });
    expect(t.density.sectionY).toBeTruthy();
    expect(t.radius.card).toBeTruthy();
    expect(t.width).toBeTruthy();
  });
});

describe("color helpers", () => {
  it("ctaTextColor picks readable ink/white over the accent", () => {
    expect(ctaTextColor("#ffff00")).toBe("#111111"); // light accent → dark text
    expect(ctaTextColor("#000080")).toBe("#ffffff"); // dark accent → white text
  });

  it("contrastRatio is symmetric and bounded", () => {
    const r = contrastRatio("#000000", "#ffffff");
    expect(r).toBeGreaterThan(20);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(r);
  });
});

describe("faviconDataUri", () => {
  it("is an encoded SVG data-URI with no raw markup to inject", () => {
    const uri = faviconDataUri("Acme", "#112233", "#ffffff");
    expect(uri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(uri).not.toContain("<script");
    expect(uri).not.toContain("<svg "); // encodeURIComponent neutralizes '<'
  });
});
