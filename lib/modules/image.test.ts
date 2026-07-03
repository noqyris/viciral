import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import { estimateCredits } from "@/lib/credits/pricing";
import { imageModule } from "./image";

// Parse through the schema so every optional field gets its default — the
// module's typed `generate` expects the full resolved Input.
const baseInput = imageModule.inputSchema.parse({
  prompt: "a red bicycle",
  variants: 2,
  useBrand: false, // keep the run brand-free so no reference images are injected
});

function ctxWith(generateImage: Providers["image"]["generateImage"]) {
  const spent: number[] = [];
  const providers = {
    text: {
      generateText: vi.fn(async () => ({ text: "", inputTokens: 0, outputTokens: 0 })),
    },
    image: { generateImage },
  } as unknown as Providers;
  return {
    spent,
    ctx: {
      userId: "u1",
      mode: "manual" as const,
      inputs: baseInput,
      brand: null,
      providers,
      spend: (c: number) => spent.push(c),
    },
  };
}

describe("image generate (charge tracks delivered work)", () => {
  it("charges the batch price when images come back", async () => {
    const { ctx, spent } = ctxWith(
      vi.fn(async () => ({
        images: [{ url: "https://img/1.png" }, { url: "https://img/2.png" }],
        modelId: "nano-banana",
      })),
    );

    const res = await imageModule.generate!(ctx);
    const imageCredits = estimateCredits("nano-banana", { numImages: baseInput.variants });

    expect(res.assets.filter((a) => a.kind === "image")).toHaveLength(2);
    expect(spent).toEqual([imageCredits]);
    expect(res.creditsUsed).toBe(imageCredits);
  });

  it("does not charge when the provider returns an empty batch (zero images)", async () => {
    // A content-filtered / malformed provider response is normalized to an empty
    // array without throwing — the user must not be billed for zero output.
    const { ctx, spent } = ctxWith(vi.fn(async () => ({ images: [], modelId: "nano-banana" })));

    const res = await imageModule.generate!(ctx);
    expect(res.assets.filter((a) => a.kind === "image")).toHaveLength(0);
    expect(spent).toEqual([]);
    expect(res.creditsUsed).toBe(0);
  });

  it("does not charge for url-less (broken) entries in the batch", async () => {
    // Every entry has an empty url → nothing is delivered → no charge.
    const { ctx, spent } = ctxWith(
      vi.fn(async () => ({ images: [{ url: "" }, { url: "" }], modelId: "nano-banana" })),
    );

    const res = await imageModule.generate!(ctx);
    expect(res.assets.filter((a) => a.kind === "image")).toHaveLength(0);
    expect(spent).toEqual([]);
    expect(res.creditsUsed).toBe(0);
  });
});
