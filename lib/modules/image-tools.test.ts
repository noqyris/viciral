import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import type { ImageTransformRequest } from "@/lib/providers/types";
import { estimateCredits } from "@/lib/credits/pricing";
import { imageToolsModule } from "./image-tools";

function ctxFor(
  inputs: { imageUrl: string; operation: "bg-remove" | "upscale" | "resize"; aspectRatio?: string },
  transform: (req: ImageTransformRequest) => Promise<{ images: { url: string }[]; modelId: string }>,
) {
  const spent: number[] = [];
  const providers = {
    image: { generateImage: vi.fn(), transformImage: transform },
  } as unknown as Providers;
  const parsed = imageToolsModule.inputSchema.parse(inputs);
  return {
    spent,
    ctx: {
      userId: "u1",
      mode: "manual" as const,
      inputs: parsed,
      brand: null,
      providers,
      spend: (c: number) => spent.push(c),
    },
  };
}

describe("image-tools estimate", () => {
  it("prices each operation to its model and is positive", () => {
    const bg = imageToolsModule.estimateCredits({ imageUrl: "https://x/y.png", operation: "bg-remove", aspectRatio: "9:16" });
    const up = imageToolsModule.estimateCredits({ imageUrl: "https://x/y.png", operation: "upscale", aspectRatio: "9:16" });
    const rs = imageToolsModule.estimateCredits({ imageUrl: "https://x/y.png", operation: "resize", aspectRatio: "9:16" });
    expect(bg).toBe(estimateCredits("bg-removal", { numImages: 1 }));
    expect(up).toBe(estimateCredits("image-upscale", { numImages: 1 }));
    expect(rs).toBe(estimateCredits("nano-banana-edit", { numImages: 1 }));
    expect(bg).toBeGreaterThan(0);
  });
});

describe("image-tools generate", () => {
  it("bg-remove calls the bg-removal model without a prompt and spends the reserved amount", async () => {
    const calls: ImageTransformRequest[] = [];
    const { ctx, spent } = ctxFor(
      { imageUrl: "https://x/y.png", operation: "bg-remove" },
      async (req) => {
        calls.push(req);
        return { images: [{ url: "https://x/out.png" }], modelId: req.modelId };
      },
    );
    const res = await imageToolsModule.generate!(ctx);
    expect(calls[0].modelId).toBe("bg-removal");
    expect(calls[0].prompt).toBeUndefined();
    expect(res.assets[0]).toMatchObject({ kind: "image", url: "https://x/out.png" });
    expect(spent[0]).toBe(res.creditsUsed);
    expect(res.creditsUsed).toBe(estimateCredits("bg-removal", { numImages: 1 }));
  });

  it("resize calls the edit model with a prompt and the chosen aspect ratio", async () => {
    const calls: ImageTransformRequest[] = [];
    const { ctx } = ctxFor(
      { imageUrl: "https://x/y.png", operation: "resize", aspectRatio: "16:9" },
      async (req) => {
        calls.push(req);
        return { images: [{ url: "https://x/wide.png" }], modelId: req.modelId };
      },
    );
    await imageToolsModule.generate!(ctx);
    expect(calls[0].modelId).toBe("nano-banana-edit");
    expect(calls[0].aspectRatio).toBe("16:9");
    expect(calls[0].prompt).toContain("16:9");
  });

  it("does NOT charge when the transform returns no image (throws instead, so the runner refunds)", async () => {
    const { ctx, spent } = ctxFor(
      { imageUrl: "https://x/y.png", operation: "bg-remove" },
      async (req) => ({ images: [], modelId: req.modelId }),
    );
    await expect(imageToolsModule.generate!(ctx)).rejects.toThrow(/nije vratila sliku/);
    expect(spent).toHaveLength(0);
  });

  it("throws if the provider has no transformImage capability", async () => {
    const parsed = imageToolsModule.inputSchema.parse({ imageUrl: "https://x/y.png", operation: "upscale" });
    const ctx = {
      userId: "u1",
      mode: "manual" as const,
      inputs: parsed,
      brand: null,
      providers: { image: { generateImage: vi.fn() } } as unknown as Providers,
      spend: () => {},
    };
    await expect(imageToolsModule.generate!(ctx)).rejects.toThrow(/ne podržava/);
  });
});
