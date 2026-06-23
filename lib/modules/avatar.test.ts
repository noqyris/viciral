import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import type { VideoRequest } from "@/lib/providers/types";
import { estimateCredits } from "@/lib/credits/pricing";
import { avatarScriptSeconds } from "@/lib/credits/estimate";
import { avatarModule } from "./avatar";

const input = {
  imageUrl: "https://x/portret.png",
  script: "Zdravo svima, ovo je test skripta za avatar prezentera.",
  voiceId: "f1" as const,
};

describe("avatarScriptSeconds", () => {
  it("clamps to the min for tiny scripts and scales up with word count", () => {
    expect(avatarScriptSeconds("dve reci")).toBe(3); // below min → clamped to 3
    const long = avatarScriptSeconds(Array.from({ length: 100 }, () => "rec").join(" "));
    expect(long).toBe(40); // 100 words / 2.5 = 40s
    const huge = avatarScriptSeconds(Array.from({ length: 1000 }, () => "rec").join(" "));
    expect(huge).toBe(120); // clamped to max
  });
});

describe("avatar module", () => {
  it("is async with a submit and no generate", () => {
    expect(avatarModule.kind).toBe("async");
    expect(typeof avatarModule.submit).toBe("function");
    expect(avatarModule.generate).toBeUndefined();
  });

  it("estimates positive and grows with a longer script", () => {
    const e1 = avatarModule.estimateCredits({ ...input, script: "kratko" });
    const e2 = avatarModule.estimateCredits({
      ...input,
      script: Array.from({ length: 200 }, () => "rec").join(" "),
    });
    expect(e1).toBeGreaterThan(0);
    expect(e2).toBeGreaterThan(e1);
  });

  it("submits a talking-avatar job with script/voice and a stable duration basis", async () => {
    const calls: VideoRequest[] = [];
    const providers = {
      video: {
        submitVideo: vi.fn(async (req: VideoRequest) => {
          calls.push(req);
          return { requestId: "req-1", modelId: req.modelId, status: "queued" as const };
        }),
      },
    } as unknown as Providers;

    const res = await avatarModule.submit!({
      userId: "u1",
      mode: "manual",
      inputs: avatarModule.inputSchema.parse(input),
      brand: null,
      providers,
    });

    expect(calls[0].modelId).toBe("talking-avatar");
    expect(calls[0].script).toBe(input.script);
    expect(calls[0].voiceId).toBe("f1");
    expect(res.modelId).toBe("talking-avatar");
    // The submit's duration basis matches the reservation (so settle == reserve).
    expect(res.params.durationSec).toBe(avatarScriptSeconds(input.script));
    expect(avatarModule.estimateCredits(input)).toBe(
      estimateCredits("talking-avatar", { durationSec: avatarScriptSeconds(input.script) }),
    );
  });
});
