/**
 * Publishing layer (skeleton). A capability interface per social platform so a
 * scheduled post can be delivered without the rest of the app knowing the
 * platform's API. Live delivery needs registered OAuth apps + tokens; until then
 * the providers are stubs that fail with a clear "connect your account" error.
 */

export type Platform = "instagram" | "tiktok" | "linkedin" | "facebook";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
];

export function isPlatform(value: string): value is Platform {
  return PLATFORMS.some((p) => p.id === value);
}

export interface PublishInput {
  caption: string;
  mediaUrl?: string;
  /** OAuth access token for the connected account. */
  accessToken: string;
  /** Platform account id. */
  externalAccountId?: string;
}

export interface PublishResult {
  /** Id of the created post on the platform. */
  externalId: string;
}

export interface PublishProvider {
  platform: Platform;
  publish(input: PublishInput): Promise<PublishResult>;
}

/** Thrown when a platform integration isn't wired yet (no OAuth app/keys). */
export class PublishNotConfiguredError extends Error {
  constructor(platform: Platform) {
    super(`Objavljivanje na ${platform} još nije konfigurisano — poveži nalog.`);
    this.name = "PublishNotConfiguredError";
  }
}
