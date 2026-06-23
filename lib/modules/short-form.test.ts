import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import { shortFormModule, formatTranscript, toClock } from "./short-form";

const baseInput = {
  mediaUrl: "https://x/podkast.mp4",
  approxMinutes: 10,
  platform: "tiktok" as const,
  clipCount: 2,
};

const CLIP_JSON = JSON.stringify({
  clips: [
    { startSec: 12, endSec: 45, title: "Hook 1", caption: "Cap 1", hashtags: ["a", "#b"], viralityScore: 88, reason: "jasna poenta" },
    { startSec: 60, endSec: 95, title: "Hook 2", caption: "Cap 2", hashtags: ["c"], viralityScore: 72, reason: "emocija" },
    { startSec: 120, endSec: 150, title: "Hook 3", caption: "Cap 3", hashtags: [], viralityScore: 50, reason: "ok" },
  ],
});

function mockProviders(opts: {
  segments?: { start: number; end: number; text: string }[];
  durationSec?: number;
  textOut?: string;
}): Providers {
  return {
    audio: {
      transcribe: vi.fn(async () => ({
        text: "ceo transkript",
        segments: opts.segments ?? [
          { start: 0, end: 30, text: "uvod" },
          { start: 30, end: 90, text: "poenta" },
        ],
        durationSec: opts.durationSec ?? 120,
      })),
    },
    text: {
      generateText: vi.fn(async () => ({
        text: opts.textOut ?? CLIP_JSON,
        inputTokens: 100,
        outputTokens: 200,
        modelId: "claude-sonnet-4-6",
      })),
    },
  } as unknown as Providers;
}

function ctxFor(providers: Providers, input = baseInput) {
  const spent: number[] = [];
  return {
    spent,
    ctx: {
      userId: "u1",
      mode: "manual" as const,
      inputs: shortFormModule.inputSchema.parse(input),
      brand: null,
      providers,
      spend: (c: number) => spent.push(c),
    },
  };
}

describe("short-form helpers", () => {
  it("toClock formats mm:ss and h:mm:ss", () => {
    expect(toClock(0)).toBe("0:00");
    expect(toClock(75)).toBe("1:15");
    expect(toClock(3661)).toBe("1:01:01");
  });

  it("formatTranscript prefixes timestamps and bounds length", () => {
    const out = formatTranscript([{ start: 5, end: 8, text: "zdravo" }]);
    expect(out).toContain("[0:05] zdravo");
  });
});

describe("short-form estimate", () => {
  it("is positive and grows with source length", () => {
    const e10 = shortFormModule.estimateCredits({ ...baseInput, approxMinutes: 10 });
    const e30 = shortFormModule.estimateCredits({ ...baseInput, approxMinutes: 30 });
    expect(e10).toBeGreaterThan(0);
    expect(e30).toBeGreaterThan(e10);
  });
});

describe("short-form generate", () => {
  it("transcribes, scores clips, caps to clipCount, and charges transcription + text", async () => {
    const providers = mockProviders({});
    const { ctx, spent } = ctxFor(providers);
    const res = await shortFormModule.generate!(ctx);

    expect(res.assets).toHaveLength(2); // capped to clipCount
    expect(res.assets.every((a) => a.kind === "text" && a.meta?.role === "clip")).toBe(true);
    expect(res.assets[0].text).toContain("Hook 1");
    // Two spend calls: transcription + text scoring; sum == creditsUsed.
    expect(spent).toHaveLength(2);
    expect(spent.reduce((a, b) => a + b, 0)).toBe(res.creditsUsed);
  });

  it("throws (and does not spend) when there is no speech", async () => {
    const providers = mockProviders({ segments: [], durationSec: 0 });
    const { ctx, spent } = ctxFor(providers);
    await expect(shortFormModule.generate!(ctx)).rejects.toThrow(/govor/);
    expect(spent).toHaveLength(0);
  });

  it("throws when the audio provider lacks transcription", async () => {
    const providers = { text: {}, image: {}, video: {} } as unknown as Providers;
    const { ctx } = ctxFor(providers);
    await expect(shortFormModule.generate!(ctx)).rejects.toThrow(/nije dostupna/);
  });
});
