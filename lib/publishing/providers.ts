import {
  PLATFORMS,
  PublishNotConfiguredError,
  type Platform,
  type PublishProvider,
} from "./types";

/**
 * Stub publish providers — one per platform. Each throws
 * {@link PublishNotConfiguredError} until the platform's OAuth app is registered
 * and a real adapter (Graph API / TikTok / LinkedIn) replaces the stub here. The
 * scheduler/cron treats this as a soft failure ("connect your account"), so the
 * calendar and queue work end-to-end before any keys exist.
 */
function stubProvider(platform: Platform): PublishProvider {
  return {
    platform,
    async publish() {
      throw new PublishNotConfiguredError(platform);
    },
  };
}

const PROVIDERS: Record<Platform, PublishProvider> = PLATFORMS.reduce(
  (acc, p) => {
    acc[p.id] = stubProvider(p.id);
    return acc;
  },
  {} as Record<Platform, PublishProvider>,
);

export function getPublishProvider(platform: Platform): PublishProvider {
  return PROVIDERS[platform];
}
