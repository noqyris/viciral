import { anthropicProvider } from "./anthropic";
import { falAudioProvider, falImageProvider, falVideoProvider } from "./fal";

/**
 * The provider bundle handed to every module. Modules call capabilities
 * (text/image/video/audio) without knowing which vendor backs them.
 */
export const providers = {
  text: anthropicProvider,
  image: falImageProvider,
  video: falVideoProvider,
  audio: falAudioProvider,
};

export type Providers = typeof providers;

export * from "./types";
