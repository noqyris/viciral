import { fal } from "@fal-ai/client";
import { requireEnv } from "@/lib/env";
import { getModel } from "@/lib/credits/pricing";
import type {
  AudioProvider,
  AudioRequest,
  ImageProvider,
  ImageRequest,
  ImageResponse,
  ImageTransformRequest,
  MusicRequest,
  MusicResponse,
  TranscriptResult,
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

  async transformImage(req: ImageTransformRequest): Promise<ImageResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    // Edit models (prompt present) take a prompt + reference image; pure
    // transforms (bg-removal/upscale) take just the image. fal returns either a
    // single `image` or an `images[]` depending on the endpoint — normalize both.
    const input =
      req.prompt !== undefined
        ? {
            prompt: req.prompt,
            image_urls: [req.imageUrl],
            ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
          }
        : { image_url: req.imageUrl };
    const result = await fal.subscribe(model.providerModel, { input, logs: false });
    const data = result.data as { image?: { url: string }; images?: { url: string }[] };
    const images = data.images ?? (data.image ? [data.image] : []);
    return { images: images.map((i) => ({ url: i.url })), modelId: req.modelId };
  },
};

export const falAudioProvider: AudioProvider = {
  async transcribe(req: AudioRequest): Promise<TranscriptResult> {
    ensureConfigured();
    const model = getModel(req.modelId);
    const result = await fal.subscribe(model.providerModel, {
      input: { audio_url: req.mediaUrl, chunk_level: "segment" },
      logs: false,
    });
    const data = result.data as {
      text?: string;
      chunks?: { timestamp: [number, number]; text: string }[];
      inferred_languages?: string[];
    };
    const segments = (data.chunks ?? [])
      .map((c) => ({
        start: c.timestamp?.[0] ?? 0,
        end: c.timestamp?.[1] ?? 0,
        // Guard text like the timestamps — a malformed chunk degrades gracefully
        // instead of throwing downstream (formatTranscript calls .trim()).
        text: c.text ?? "",
      }))
      .filter((s) => s.text.trim().length > 0);
    return {
      text: data.text ?? "",
      segments,
      language: data.inferred_languages?.[0],
      durationSec: segments.length ? segments[segments.length - 1].end : undefined,
    };
  },

  async generateMusic(req: MusicRequest): Promise<MusicResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    const result = await fal.subscribe(model.providerModel, {
      input: { prompt: req.prompt, seconds_total: req.durationSec },
      logs: false,
    });
    const data = result.data as { audio?: { url: string }; audio_file?: { url: string } };
    return { audioUrl: data.audio?.url ?? data.audio_file?.url ?? "" };
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
        // Seedance 2 generates native synchronized audio; opt in/out explicitly.
        ...(req.withAudio !== undefined ? { generate_audio: req.withAudio } : {}),
        // Talking-head models: spoken script + voice.
        ...(req.script ? { text: req.script } : {}),
        ...(req.voiceId ? { voice: req.voiceId } : {}),
        // Dubbing/translation: source video + target language.
        ...(req.videoUrl ? { video_url: req.videoUrl } : {}),
        ...(req.targetLang ? { target_language: req.targetLang } : {}),
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
