import { fal } from "@fal-ai/client";
import { requireEnv } from "@/lib/env";
import { getModel } from "@/lib/credits/pricing";
import type {
  ImageProvider,
  ImageRequest,
  ImageResponse,
  VideoProvider,
  VideoRequest,
  VideoResult,
  VideoSubmitResponse,
} from "./types";

let configured = false;
function ensureConfigured() {
  if (!configured) {
    fal.config({ credentials: requireEnv("FAL_KEY") });
    configured = true;
  }
}

export const falImageProvider: ImageProvider = {
  async generateImage(req: ImageRequest): Promise<ImageResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    const result = await fal.subscribe(model.providerModel, {
      input: {
        prompt: req.prompt,
        num_images: req.numImages ?? 1,
        ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
        ...(req.imageUrls?.length ? { image_urls: req.imageUrls } : {}),
      },
      logs: false,
    });
    const data = result.data as { images?: { url: string }[] };
    return {
      images: (data.images ?? []).map((i) => ({ url: i.url })),
      modelId: req.modelId,
    };
  },
};

export const falVideoProvider: VideoProvider = {
  async submitVideo(req: VideoRequest): Promise<VideoSubmitResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    // Seedance image-to-video derives output resolution from the input image, so
    // we don't forward width/height here. The reservation and the settlement use
    // the same assumed dimensions (consistent charge); the webhook reports actual
    // dimensions when available so the cost basis tracks the real output.
    const queued = await fal.queue.submit(model.providerModel, {
      input: {
        ...(req.prompt ? { prompt: req.prompt } : {}),
        ...(req.imageUrl ? { image_url: req.imageUrl } : {}),
        ...(req.durationSec ? { duration: req.durationSec } : {}),
      },
      ...(req.webhookUrl ? { webhookUrl: req.webhookUrl } : {}),
    });
    return { requestId: queued.request_id, modelId: req.modelId, status: "queued" };
  },

  async fetchResult(requestId: string, modelId: string): Promise<VideoResult> {
    ensureConfigured();
    const model = getModel(modelId);
    const status = await fal.queue.status(model.providerModel, { requestId });
    if (status.status === "COMPLETED") {
      const result = await fal.queue.result(model.providerModel, { requestId });
      const data = result.data as { video?: { url: string } };
      return { status: "completed", videoUrl: data.video?.url };
    }
    if (status.status === "IN_QUEUE" || status.status === "IN_PROGRESS") {
      return { status: "queued" };
    }
    return { status: "failed", error: "Unknown queue status" };
  },
};
