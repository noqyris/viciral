import { describe, expect, it } from "vitest";
import { MODULES, getModuleDef } from "./registry";

/**
 * Registry contract + input-schema boundary tests. Pure: every module's
 * `inputSchema` / `estimateCredits` is synchronous pricing math, so no network,
 * fal, anthropic, or db access is touched here.
 */

describe("module registry contract", () => {
  it("every module declares inputSchema, estimateCredits and exactly one runner", () => {
    for (const m of MODULES) {
      expect(m.inputSchema, `${m.slug}: inputSchema`).toBeDefined();
      expect(typeof m.inputSchema.safeParse, `${m.slug}: inputSchema is a zod schema`).toBe(
        "function",
      );
      expect(typeof m.estimateCredits, `${m.slug}: estimateCredits`).toBe("function");

      const hasGenerate = typeof m.generate === "function";
      const hasSubmit = typeof m.submit === "function";
      // Exactly one of generate / submit (sync vs async).
      expect(hasGenerate !== hasSubmit, `${m.slug}: exactly one of generate/submit`).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const slugs = MODULES.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

/** Tiny helpers so each case reads as accept / reject against the live schema. */
function schemaOf(slug: string) {
  const m = getModuleDef(slug);
  if (!m) throw new Error(`missing module: ${slug}`);
  return m.inputSchema;
}
const accepts = (slug: string, input: unknown) => schemaOf(slug).safeParse(input).success;
const rejects = (slug: string, input: unknown) => !schemaOf(slug).safeParse(input).success;

describe("module input-schema boundaries", () => {
  it("cinematic accepts 5s and 10s and rejects 7s", () => {
    const base = { prompt: "spori zoom", imageUrl: "https://example.com/img.png" };
    expect(accepts("cinematic", { ...base, durationSec: 5 })).toBe(true);
    expect(accepts("cinematic", { ...base, durationSec: 10 })).toBe(true);
    expect(rejects("cinematic", { ...base, durationSec: 7 })).toBe(true);
  });

  it("cinematic rejects a missing image url", () => {
    expect(rejects("cinematic", { prompt: "spori zoom" })).toBe(true);
  });

  it("image-tools rejects an invalid operation", () => {
    const base = { imageUrl: "https://example.com/img.png" };
    expect(accepts("image-tools", { ...base, operation: "bg-remove" })).toBe(true);
    expect(rejects("image-tools", { ...base, operation: "nonsense" })).toBe(true);
  });

  it("dubbing accepts a valid run and rejects out-of-range seconds", () => {
    expect(
      accepts("dubbing", {
        videoUrl: "https://example.com/clip.mp4",
        targetLang: "en",
        approxSeconds: 30,
      }),
    ).toBe(true);
    expect(
      rejects("dubbing", { videoUrl: "https://example.com/clip.mp4", approxSeconds: 1 }),
    ).toBe(true);
    expect(
      rejects("dubbing", { videoUrl: "https://example.com/clip.mp4", approxSeconds: 999 }),
    ).toBe(true);
  });

  it("music accepts an in-range duration and rejects bad duration or empty prompt", () => {
    expect(accepts("music", { prompt: "lo-fi beat", durationSec: 20 })).toBe(true);
    expect(rejects("music", { prompt: "lo-fi beat", durationSec: 3 })).toBe(true);
    expect(rejects("music", { prompt: "lo-fi beat", durationSec: 200 })).toBe(true);
    expect(rejects("music", { prompt: "", durationSec: 20 })).toBe(true);
  });

  it("editor requires an instruction of length >= 2", () => {
    const base = { imageUrl: "https://example.com/img.png" };
    expect(accepts("editor", { ...base, instruction: "ok" })).toBe(true);
    expect(rejects("editor", { ...base, instruction: "x" })).toBe(true);
  });

  it("website requires name and description of length >= 2", () => {
    expect(accepts("website", { siteName: "Brend", description: "Opis brenda" })).toBe(true);
    expect(rejects("website", { siteName: "B", description: "Opis brenda" })).toBe(true);
    expect(rejects("website", { siteName: "Brend", description: "O" })).toBe(true);
  });
});
