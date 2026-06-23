import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import type { MusicRequest } from "@/lib/providers/types";
import { estimateCredits } from "@/lib/credits/pricing";
import { musicModule } from "./music";

function ctxFor(
  inputs: { prompt: string; durationSec: number },
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

describe("music module", () => {
  it("estimates per second", () => {
    expect(musicModule.estimateCredits({ prompt: "x", durationSec: 20 })).toBe(
      estimateCredits("music-gen", { durationSec: 20 }),
    );
  });

  it("returns an audio asset and spends exactly the reserve", async () => {
    const calls: MusicRequest[] = [];
    const { ctx, spent } = ctxFor({ prompt: "vesela gitara", durationSec: 20 }, async (req) => {
      calls.push(req);
      return { audioUrl: "https://x/m.mp3" };
    });
    const res = await musicModule.generate!(ctx);
    expect(calls[0].modelId).toBe("music-gen");
    expect(res.assets[0]).toMatchObject({ kind: "audio", url: "https://x/m.mp3" });
    expect(spent[0]).toBe(res.creditsUsed);
  });

  it("does NOT charge when no track is returned", async () => {
    const { ctx, spent } = ctxFor({ prompt: "test muzika", durationSec: 20 }, async () => ({ audioUrl: "" }));
    await expect(musicModule.generate!(ctx)).rejects.toThrow(/nije generisana/);
    expect(spent).toHaveLength(0);
  });

  it("throws when the provider cannot generate music", async () => {
    const providers = { audio: { transcribe: vi.fn() } } as unknown as Providers;
    const ctx = {
      userId: "u1",
      mode: "manual" as const,
      inputs: musicModule.inputSchema.parse({ prompt: "test muzika", durationSec: 20 }),
      brand: null,
      providers,
      spend: () => {},
    };
    await expect(musicModule.generate!(ctx)).rejects.toThrow(/nije dostupno/);
  });
});
