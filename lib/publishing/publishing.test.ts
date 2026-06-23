import { describe, expect, it } from "vitest";
import { PLATFORMS, isPlatform, PublishNotConfiguredError } from "./types";
import { getPublishProvider } from "./providers";

describe("publishing layer", () => {
  it("recognizes valid platforms only", () => {
    expect(isPlatform("instagram")).toBe(true);
    expect(isPlatform("linkedin")).toBe(true);
    expect(isPlatform("myspace")).toBe(false);
    expect(PLATFORMS.length).toBeGreaterThanOrEqual(4);
  });

  it("stub providers fail with a clear not-configured error (never silently 'publish')", async () => {
    for (const p of PLATFORMS) {
      const provider = getPublishProvider(p.id);
      expect(provider.platform).toBe(p.id);
      await expect(
        provider.publish({ caption: "test", accessToken: "tok" }),
      ).rejects.toBeInstanceOf(PublishNotConfiguredError);
    }
  });
});
