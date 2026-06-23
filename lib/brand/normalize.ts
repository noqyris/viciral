import type { BrandProfileDraft } from "@/lib/modules/types";

/**
 * Caps for brand-memory fields. Must match the limits the /api/brands route
 * enforces so the two write paths (human form + Brand Kit model output) can't
 * persist differently-bounded data into the same table.
 */
export const BRAND_LIMITS = {
  name: 80,
  voice: 200,
  notes: 1000,
  colorLength: 40,
  colorCount: 12,
  refCount: 6,
  refUrlLength: 600,
} as const;

/**
 * True for private / loopback / link-local hosts we must never hand to a
 * provider's image fetcher (these reference URLs are sent to fal as image_urls).
 * Blocks cloud metadata (169.254.169.254), localhost, and RFC1918/ULA ranges.
 */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv6 loopback (::1), unique-local (fc00::/7 → fc/fd), link-local (fe80::/10).
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

/** A safe, public http(s) image URL (no userinfo, no private/loopback host). */
function isSafeRefUrl(raw: string): boolean {
  if (raw.length > BRAND_LIMITS.refUrlLength) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  return !isBlockedHost(url.hostname);
}

/**
 * Coerces the Json `referenceImages` field into clean, SAFE, public http(s)
 * URLs, bounded in count and length. These are injected as image-to-image
 * references into generations (and sent to the provider's fetcher), so — like
 * brand text — untrusted/oversized/private-host values are rejected here (the
 * single choke point before durable brand memory or a provider call).
 */
export function referenceImagesToStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter((u) => isSafeRefUrl(u))
    .slice(0, BRAND_LIMITS.refCount);
}

/**
 * Clamps a (possibly model-generated, possibly prompt-injected) brand draft to
 * the same bounds as the human-facing brand form. Brand memory is re-injected
 * into every future generation's prompt, so this is the choke point that keeps
 * untrusted model output from bloating or hijacking downstream prompts.
 */
export function clampBrandDraft(draft: BrandProfileDraft): BrandProfileDraft {
  const colors = (draft.colors ?? [])
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim().slice(0, BRAND_LIMITS.colorLength))
    .slice(0, BRAND_LIMITS.colorCount);

  const voice = draft.voice?.trim().slice(0, BRAND_LIMITS.voice);
  const notes = draft.notes?.trim().slice(0, BRAND_LIMITS.notes);
  const referenceImages = referenceImagesToStrings(draft.referenceImages);

  return {
    name: draft.name.trim().slice(0, BRAND_LIMITS.name),
    voice: voice || undefined,
    notes: notes || undefined,
    colors: colors.length ? colors : undefined,
    referenceImages: referenceImages.length ? referenceImages : undefined,
  };
}
