import { anthropicProvider } from "./anthropic";
import { falImageProvider, falVideoProvider } from "./fal";

/**
 * The provider bundle handed to every module. Modules call capabilities
 * (text/image/video) without knowing which vendor backs them.
 */
export const providers = {
  text: anthropicProvider,
  image: falImageProvider,
  video: falVideoProvider,
};

export type Providers = typeof providers;

export * from "./types";
