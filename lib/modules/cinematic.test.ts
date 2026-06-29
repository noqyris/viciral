import { describe, expect, it } from "vitest";
import { cinematicModule } from "./cinematic";

const base = cinematicModule.inputSchema.parse({
  prompt: "spori zoom na proizvod",
  imageUrl: "https://example.com/img.png",
  durationSec: 5,
  withAudio: true,
});

describe("cinematic estimate", () => {
  it("estimates a positive cost and is async", () => {
    expect(cinematicModule.kind).toBe("async");
    expect(cinematicModule.estimateCredits(base)).toBeGreaterThan(0);
  });

  it("costs more for a longer clip", () => {
    const five = cinematicModule.estimateCredits({ ...base, durationSec: 5 });
    const ten = cinematicModule.estimateCredits({ ...base, durationSec: 10 });
    expect(ten).toBeGreaterThan(five);
  });
});
