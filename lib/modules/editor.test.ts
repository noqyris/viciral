import { describe, expect, it, vi } from "vitest";
import type { Providers } from "@/lib/providers";
import type { ImageTransformRequest } from "@/lib/providers/types";
import { estimateCredits } from "@/lib/credits/pricing";
import { editorModule } from "./editor";

function ctxFor(
  inputs: { imageUrl: string; instruction: string; aspectRatio?: string },
  transform: (req: ImageTransformRequest) => Promise<{ images: { url: string }[]; modelId: string }>,
) {
  const spent: number[] = [];
  const providers = {
    image: { generateImage: vi.fn(), transformImage: transform },
  } as unknown as Providers;
  return {
    spent,
    ctx: {
      userId: "u1",
      mode: "manual" as const,
      inputs: editorModule.inputSchema.parse(inputs),
      brand: null,
      providers,
      spend: (c: number) => spent.push(c),
    },
  };
}

describe("editor estimate", () => {
  it("is one nano-banana edit per apply", () => {
    expect(
      editorModule.estimateCredits({
        imageUrl: "https://x/y.png",
        instruction: "promeni",
        aspectRatio: "original",
      }),
    ).toBe(estimateCredits("nano-banana-edit", { numImages: 1 }));
  });
});

describe("editor generate", () => {
  it("edits via nano-banana-edit with the instruction as prompt and spends the reserve", async () => {
    const calls: ImageTransformRequest[] = [];
    const { ctx, spent } = ctxFor(
      { imageUrl: "https://x/y.png", instruction: "ukloni naočare" },
      async (req) => {
        calls.push(req);
        return { images: [{ url: "https://x/edited.png" }], modelId: req.modelId };
      },
    );
    const res = await editorModule.generate!(ctx);
    expect(calls[0].modelId).toBe("nano-banana-edit");
    expect(calls[0].prompt).toBe("ukloni naočare");
    expect(calls[0].aspectRatio).toBeUndefined(); // "original" → not forwarded
    expect(res.assets[0]).toMatchObject({ kind: "image", url: "https://x/edited.png" });
    expect(spent[0]).toBe(res.creditsUsed);
  });

  it("forwards a non-original aspect ratio", async () => {
    const calls: ImageTransformRequest[] = [];
    const { ctx } = ctxFor(
      { imageUrl: "https://x/y.png", instruction: "reframe", aspectRatio: "16:9" },
      async (req) => {
        calls.push(req);
        return { images: [{ url: "https://x/wide.png" }], modelId: req.modelId };
      },
    );
    await editorModule.generate!(ctx);
    expect(calls[0].aspectRatio).toBe("16:9");
  });

  it("does NOT charge when the edit returns no image", async () => {
    const { ctx, spent } = ctxFor(
      { imageUrl: "https://x/y.png", instruction: "promeni" },
      async (req) => ({ images: [], modelId: req.modelId }),
    );
    await expect(editorModule.generate!(ctx)).rejects.toThrow(/nije vratila sliku/);
    expect(spent).toHaveLength(0);
  });

  it("throws if the provider lacks transformImage", async () => {
    const ctx = {
      userId: "u1",
      mode: "manual" as const,
      inputs: editorModule.inputSchema.parse({ imageUrl: "https://x/y.png", instruction: "promeni" }),
      brand: null,
      providers: { image: { generateImage: vi.fn() } } as unknown as Providers,
      spend: () => {},
    };
    await expect(editorModule.generate!(ctx)).rejects.toThrow(/ne podržava/);
  });
});
