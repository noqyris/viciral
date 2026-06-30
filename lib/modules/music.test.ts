import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import type { MusicRequest } from "@/lib/providers/types";
import { estimateCredits } from "@/lib/credits/pricing";
import { musicModule } from "./music";

function ctxFor(
  inputs: { prompt: string },
  generateMusic: (req: MusicRequest) => Promise<{ audioUrl: string }>,
) {
  const spent: number[] = [];
  const providers = {
    audio: { transcribe: vi.fn(), generateMusic },
  } as unknown as Providers;
  return {
    spent,
    ctx: {
      userId: "u1",
      mode: "manual" as const,
      inputs: musicModule.inputSchema.parse(inputs),
      brand: null,
      providers,
      spend: (c: number) => spent.push(c),
    },
  };
}

describe("music module (Lyria 2)", () => {
  it("estimates a flat per-generation cost", () => {
    expect(musicModule.estimateCredits({ prompt: "x" })).toBe(
      estimateCredits("lyria-2", { numImages: 1 }),
    );
  });

  it("returns an audio asset (via Lyria) and spends exactly the reserve", async () => {
    const calls: MusicRequest[] = [];
    const { ctx, spent } = ctxFor({ prompt: "vesela gitara" }, async (req) => {
      calls.push(req);
      return { audioUrl: "https://x/m.wav" };
    });
    const res = await musicModule.generate!(ctx);
    expect(calls[0].modelId).toBe("lyria-2");
    expect(res.assets[0]).toMatchObject({ kind: "audio", url: "https://x/m.wav" });
    expect(spent[0]).toBe(res.creditsUsed);
  });

  it("does NOT charge when no track is returned", async () => {
    const { ctx, spent } = ctxFor({ prompt: "test muzika" }, async () => ({ audioUrl: "" }));
    await expect(musicModule.generate!(ctx)).rejects.toThrow(/nije generisana/);
    expect(spent).toHaveLength(0);
  });

  it("throws when the provider cannot generate music", async () => {
    const providers = { audio: { transcribe: vi.fn() } } as unknown as Providers;
    const ctx = {
      userId: "u1",
      mode: "manual" as const,
      inputs: musicModule.inputSchema.parse({ prompt: "test muzika" }),
      brand: null,
      providers,
      spend: () => {},
    };
    await expect(musicModule.generate!(ctx)).rejects.toThrow(/nije dostupno/);
  });
});
