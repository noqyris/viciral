import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import type { VideoRequest } from "@/lib/providers/types";
import { estimateCredits } from "@/lib/credits/pricing";
import { dubbingModule } from "./dubbing";

const input = { videoUrl: "https://x/v.mp4", targetLang: "es" as const, approxSeconds: 30 };

describe("dubbing module", () => {
  it("is async with a submit and no generate", () => {
    expect(dubbingModule.kind).toBe("async");
    expect(typeof dubbingModule.submit).toBe("function");
    expect(dubbingModule.generate).toBeUndefined();
  });

  it("estimates per declared length and grows with it", () => {
    expect(dubbingModule.estimateCredits(input)).toBe(
      estimateCredits("video-dub", { durationSec: 30 }),
    );
    expect(dubbingModule.estimateCredits({ ...input, approxSeconds: 90 })).toBeGreaterThan(
      dubbingModule.estimateCredits(input),
    );
  });

  it("submits with the source video + target language and a stable duration basis", async () => {
    const calls: VideoRequest[] = [];
    const providers = {
      video: {
        submitVideo: vi.fn(async (req: VideoRequest) => {
          calls.push(req);
          return { requestId: "r1", modelId: req.modelId, status: "queued" as const };
        }),
      },
    } as unknown as Providers;

    const res = await dubbingModule.submit!({
      userId: "u1",
      mode: "manual",
      inputs: dubbingModule.inputSchema.parse(input),
      brand: null,
      providers,
    });

    expect(calls[0].modelId).toBe("video-dub");
    expect(calls[0].videoUrl).toBe(input.videoUrl);
    expect(calls[0].targetLang).toBe("es");
    expect(res.modelId).toBe("video-dub");
    expect(res.params.durationSec).toBe(30);
  });
});
