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
  SpeechRequest,
  SpeechResponse,
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

/** Map our aspect-ratio enum to GPT Image's fixed `image_size` enum. */
function gptImageSize(aspect?: string): string {
  if (aspect === "1:1") return "1024x1024";
  if (aspect === "16:9" || aspect === "1.91:1") return "1536x1024";
  return "1024x1536"; // portrait / default
}

/** Parse a #rgb / #rrggbb hex into Recraft's {r,g,b} (0–255); null if invalid. */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const falImageProvider: ImageProvider = {
  async generateImage(req: ImageRequest): Promise<ImageResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    // Each image model has its own input contract.
    let input: Record<string, unknown>;
    if (req.modelId === "recraft-vector") {
      // Recraft (vector): no num_images/aspect_ratio; brand `colors` ({r,g,b}) + size enum.
      input = {
        prompt: req.prompt,
        ...(req.colors?.length
          ? { colors: req.colors.map(hexToRgb).filter((c): c is { r: number; g: number; b: number } => c !== null) }
          : {}),
        ...(req.imageSize ? { image_size: req.imageSize } : {}),
      };
    } else if (req.modelId === "gpt-image") {
      // GPT Image: fixed `image_size` enum (from aspect) + quality tier; no aspect_ratio.
      input = {
        prompt: req.prompt,
        num_images: req.numImages ?? 1,
        image_size: gptImageSize(req.aspectRatio),
        quality: "medium",
        ...(req.outputFormat ? { output_format: req.outputFormat } : {}),
      };
    } else {
      // nano-banana / nano-banana-pro (Gemini contract).
      input = {
        prompt: req.prompt,
        num_images: req.numImages ?? 1,
        ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
        ...(req.imageUrls?.length ? { image_urls: req.imageUrls } : {}),
        ...(req.outputFormat ? { output_format: req.outputFormat } : {}),
        ...(req.seed !== undefined ? { seed: req.seed } : {}),
        ...(req.safetyTolerance ? { safety_tolerance: req.safetyTolerance } : {}),
      };
    }
    const result = await fal.subscribe(model.providerModel, {
      input,
      logs: false,
    });
    // fal returns either an `images[]` or a single `image` depending on the
    // endpoint (e.g. recraft-vector) — normalize both, same as transformImage.
    const data = result.data as { image?: { url: string }; images?: { url: string }[] };
    const images = data.images ?? (data.image ? [data.image] : []);
    return {
      images: images.map((i) => ({ url: i.url })),
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
    // Lyria 2 has a FIXED 30s length (no seconds_total); stable-audio takes one.
    const input =
      req.modelId === "lyria-2"
        ? { prompt: req.prompt }
        : { prompt: req.prompt, seconds_total: req.durationSec };
    const result = await fal.subscribe(model.providerModel, { input, logs: false });
    const data = result.data as { audio?: { url: string }; audio_file?: { url: string } };
    return { audioUrl: data.audio?.url ?? data.audio_file?.url ?? "" };
  },

  async generateSpeech(req: SpeechRequest): Promise<SpeechResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    const result = await fal.subscribe(model.providerModel, {
      input: {
        text: req.text,
        ...(req.voice ? { voice: req.voice } : {}),
        ...(req.stability !== undefined ? { stability: req.stability } : {}),
        ...(req.similarityBoost !== undefined ? { similarity_boost: req.similarityBoost } : {}),
        ...(req.style !== undefined ? { style: req.style } : {}),
        ...(req.speed !== undefined ? { speed: req.speed } : {}),
        ...(req.languageCode ? { language_code: req.languageCode } : {}),
      },
      logs: false,
    });
    const data = result.data as { audio?: { url: string } };
    return { audioUrl: data.audio?.url ?? "" };
  },
};

/** Veo i2v only accepts auto/16:9/9:16 — map our wider aspect set down. */
function veoAspect(a: string): string {
  return a === "16:9" || a === "9:16" ? a : "auto";
}

/**
 * Each video model has its own input contract. We map our normalized VideoRequest
 * to the exact keys/serialization each fal endpoint expects (verified schemas).
 */
function buildVideoInput(req: VideoRequest): Record<string, unknown> {
  if (req.modelId === "veo-3") {
    return {
      ...(req.prompt ? { prompt: req.prompt } : {}),
      ...(req.imageUrl ? { image_url: req.imageUrl } : {}),
      // Veo duration is "4s" | "6s" | "8s".
      ...(req.durationSec ? { duration: `${req.durationSec}s` } : {}),
      ...(req.aspectRatio ? { aspect_ratio: veoAspect(req.aspectRatio) } : {}),
      ...(req.resolution ? { resolution: req.resolution } : {}),
      ...(req.withAudio !== undefined ? { generate_audio: req.withAudio } : {}),
    };
  }
  if (req.modelId === "kling-video") {
    return {
      ...(req.prompt ? { prompt: req.prompt } : {}),
      // Kling Pro i2v uses `start_image_url` (NOT image_url) + optional end frame.
      ...(req.imageUrl ? { start_image_url: req.imageUrl } : {}),
      ...(req.endImageUrl ? { end_image_url: req.endImageUrl } : {}),
      ...(req.durationSec ? { duration: String(req.durationSec) } : {}),
      ...(req.withAudio !== undefined ? { generate_audio: req.withAudio } : {}),
    };
  }
  if (req.modelId === "sora-2") {
    return {
      ...(req.prompt ? { prompt: req.prompt } : {}),
      ...(req.imageUrl ? { image_url: req.imageUrl } : {}),
      // Sora duration is an INTEGER (4/8/12/16/20), not a "Ns" string.
      ...(req.durationSec ? { duration: req.durationSec } : {}),
      ...(req.aspectRatio ? { aspect_ratio: veoAspect(req.aspectRatio) } : {}),
    };
  }
  // Seedance + talking-head/dubbing (the original shape).
  return {
    ...(req.prompt ? { prompt: req.prompt } : {}),
    ...(req.imageUrl ? { image_url: req.imageUrl } : {}),
    // Seedance expects duration as a STRING enum ("auto","4"…"15").
    ...(req.durationSec ? { duration: String(req.durationSec) } : {}),
    // Seedance accepts aspect_ratio directly (auto/16:9/9:16/1:1/4:3/3:4/21:9).
    ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
    ...(req.resolution ? { resolution: req.resolution } : {}),
    ...(req.endImageUrl ? { end_image_url: req.endImageUrl } : {}),
    ...(req.bitrateMode ? { bitrate_mode: req.bitrateMode } : {}),
    ...(req.endUserId ? { end_user_id: req.endUserId } : {}),
    // Seedance 2 generates native synchronized audio; opt in/out explicitly.
    ...(req.withAudio !== undefined ? { generate_audio: req.withAudio } : {}),
    // Talking-head models: spoken script + voice.
    ...(req.script ? { text: req.script } : {}),
    ...(req.voiceId ? { voice: req.voiceId } : {}),
    // Dubbing/translation: source video + target language.
    ...(req.videoUrl ? { video_url: req.videoUrl } : {}),
    ...(req.targetLang ? { target_language: req.targetLang } : {}),
  };
}

export const falVideoProvider: VideoProvider = {
  async submitVideo(req: VideoRequest): Promise<VideoSubmitResponse> {
    ensureConfigured();
    const model = getModel(req.modelId);
    const queued = await fal.queue.submit(model.providerModel, {
      input: buildVideoInput(req),
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

  // ---- Video-chain utilities (synchronous ffmpeg endpoints) ----

  async extractLastFrame(videoUrl: string): Promise<string> {
    ensureConfigured();
    const model = getModel("ffmpeg-extract-frame");
    const result = await fal.subscribe(model.providerModel, {
      input: { video_url: videoUrl, frame_type: "last" },
      logs: false,
    });
    const data = result.data as { images?: { url: string }[] };
    const url = data.images?.[0]?.url;
    if (!url) throw new Error("Frame extraction returned no image");
    return url;
  },

  async mergeVideos(videoUrls: string[]): Promise<string> {
    ensureConfigured();
    const model = getModel("ffmpeg-merge");
    const result = await fal.subscribe(model.providerModel, {
      input: { video_urls: videoUrls },
      logs: false,
    });
    const data = result.data as { video?: { url: string } };
    const url = data.video?.url;
    if (!url) throw new Error("Video merge returned no video");
    return url;
  },
};
