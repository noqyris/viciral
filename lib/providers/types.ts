/**
 * Provider abstraction. Each capability (text / image / video) has a narrow
 * interface so a module step can be routed to fal.ai, Anthropic, or a direct
 * provider, and a step can be re-pointed if a provider's pricing/ToS changes
 * (mitigates platform-dependency risk).
 */

// ---- Audio / transcription ----
export interface TranscriptSegment {
  /** Seconds from the start of the media. */
  start: number;
  end: number;
  text: string;
}

export interface TranscriptResult {
  text: string;
  segments: TranscriptSegment[];
  language?: string;
  /** Total media duration in seconds, when the provider reports it. */
  durationSec?: number;
}

export interface AudioRequest {
  /** Catalog model id, e.g. "whisper". */
  modelId: string;
  /** URL of the audio/video to transcribe. */
  mediaUrl: string;
}

export interface MusicRequest {
  /** Catalog model id, e.g. "music-gen". */
  modelId: string;
  prompt: string;
  durationSec: number;
}

export interface MusicResponse {
  audioUrl: string;
}

export interface SpeechRequest {
  /** Catalog model id, e.g. "elevenlabs-tts". */
  modelId: string;
  text: string;
  /** Voice preset name (e.g. "Rachel", "Aria"). */
  voice?: string;
  /** Voice stability 0–1. */
  stability?: number;
  /** Adherence to the original voice 0–1. */
  similarityBoost?: number;
  /** Style exaggeration 0–1. */
  style?: number;
  /** Playback speed 0.7–1.2. */
  speed?: number;
  /** ISO 639-1 language code to enforce. */
  languageCode?: string;
}

export interface SpeechResponse {
  audioUrl: string;
}

export interface AudioProvider {
  transcribe(req: AudioRequest): Promise<TranscriptResult>;
  /** Optional: not every audio backend can generate music. */
  generateMusic?(req: MusicRequest): Promise<MusicResponse>;
  /** Optional: text-to-speech voiceover. */
  generateSpeech?(req: SpeechRequest): Promise<SpeechResponse>;
}

// ---- Text ----
export interface TextRequest {
  prompt: string;
  system?: string;
  /** Provider model id (e.g. "claude-sonnet-4-6"). Defaults per adapter. */
  model?: string;
  maxTokens?: number;
  /** Sampling temperature — ONLY honored on Sonnet/Haiku (Opus 4.x returns 400). */
  temperature?: number;
  /** Reasoning depth (output_config.effort). */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** Custom stop sequences. */
  stopSequences?: string[];
}

export interface TextResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
}

export interface TextProvider {
  generateText(req: TextRequest): Promise<TextResponse>;
}

// ---- Image ----
export interface ImageRequest {
  /** Catalog model id (see lib/credits/pricing.ts), e.g. "nano-banana". */
  modelId: string;
  prompt: string;
  numImages?: number;
  aspectRatio?: string;
  /** Reference/edit images (image-to-image). */
  imageUrls?: string[];
  // ---- Advanced (nano-banana) ----
  /** Output container: "jpeg" | "png" | "webp". */
  outputFormat?: string;
  /** Deterministic seed (omit for random). */
  seed?: number;
  /** Safety strictness as a STRING "1"–"6" (1 strictest). */
  safetyTolerance?: string;
  // ---- Recraft (vector) ----
  /** Brand colors as hex strings; the adapter converts to {r,g,b}. */
  colors?: string[];
  /** Recraft size enum (e.g. "square_hd", "landscape_16_9"). */
  imageSize?: string;
}

export interface ImageResponse {
  images: { url: string }[];
  modelId: string;
}

/**
 * Single-image-in → single-image-out transforms: background removal, upscaling,
 * and prompt-driven edits (resize/outpaint/inpaint). `prompt` present ⇒ an edit
 * model (e.g. nano-banana-edit); absent ⇒ a pure transform (bg-removal/upscale).
 */
export interface ImageTransformRequest {
  /** Catalog model id, e.g. "bg-removal", "image-upscale", "nano-banana-edit". */
  modelId: string;
  imageUrl: string;
  prompt?: string;
  aspectRatio?: string;
}

export interface ImageProvider {
  generateImage(req: ImageRequest): Promise<ImageResponse>;
  /** Optional: not every image backend supports transforms. */
  transformImage?(req: ImageTransformRequest): Promise<ImageResponse>;
}

// ---- Video (async / queued) ----
export interface VideoRequest {
  modelId: string;
  prompt?: string;
  imageUrl?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  /** Output aspect ratio (e.g. "9:16", "16:9", "1:1") — Seedance accepts this directly. */
  aspectRatio?: string;
  /** Output resolution: "480p" | "720p" | "1080p" | "4k" (drives Seedance cost). */
  resolution?: string;
  /** Optional end frame — the clip transitions from imageUrl to this still. */
  endImageUrl?: string;
  /** Encode quality: "standard" | "high". */
  bitrateMode?: string;
  /** Server-set abuse-attribution id (never user-facing). */
  endUserId?: string;
  /** Generate native synchronized audio (music/SFX/dialogue) with the clip. */
  withAudio?: boolean;
  /** Talking-head script (text the avatar speaks). */
  script?: string;
  /** Voice id for talking-head TTS. */
  voiceId?: string;
  /** Source video URL (e.g. for dubbing/translation). */
  videoUrl?: string;
  /** Target language code for dubbing/translation. */
  targetLang?: string;
  /** Provider posts completion here (fal webhook). */
  webhookUrl?: string;
}

export interface VideoSubmitResponse {
  requestId: string;
  modelId: string;
  status: "queued";
}

export interface VideoResult {
  status: "queued" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface VideoProvider {
  submitVideo(req: VideoRequest): Promise<VideoSubmitResponse>;
  fetchResult(requestId: string, modelId: string): Promise<VideoResult>;
  /**
   * Arbitrary-length video is built by chaining clips: these utilities extract a
   * clip's last frame (to seed the next clip) and merge the finished clips into
   * one. Optional — not every video backend exposes ffmpeg utilities.
   */
  extractLastFrame?(videoUrl: string): Promise<string>;
  mergeVideos?(videoUrls: string[]): Promise<string>;
}
