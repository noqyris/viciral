import type { BrandProfile } from "@prisma/client";
import { referenceImagesToStrings } from "./normalize";

/** Coerces the Json `colors` field into a clean string[]. */
export function colorsToStrings(colors: unknown): string[] {
  if (!Array.isArray(colors)) return [];
  return colors.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
}

/**
 * The brand's persistent character/face/product reference image URLs, validated
 * (http(s)-only, bounded). Modules pass these as image-to-image references so
 * generated images keep the same subject/look — the consistency moat.
 */
export function brandReferenceImages(brand: BrandProfile | null | undefined): string[] {
  if (!brand) return [];
  return referenceImagesToStrings(brand.referenceImages);
}

/**
 * Builds a Serbian brand-context line injected into generation prompts.
 * Pure — depends only on its inputs (the brand-memory moat in prompt form).
 */
export function brandPromptLine(
  brand: BrandProfile | null | undefined,
  fallbackTone: string,
): string {
  if (!brand) return `Ton: ${fallbackTone}.`;

  const parts: string[] = [`Brend: ${brand.name}.`];
  parts.push(`Ton glasa: ${brand.voice?.trim() || fallbackTone}.`);

  const colors = colorsToStrings(brand.colors);
  if (colors.length) parts.push(`Boje brenda: ${colors.join(", ")}.`);

  if (brand.notes?.trim()) parts.push(`Napomene o brendu: ${brand.notes.trim()}.`);

  return parts.join(" ");
}

/** Bumped when the brand-context format changes (greppable in prompts/logs). */
export const BRAND_CONTEXT_VERSION = 1;

/**
 * The single canonical brand context injected into EVERY generation — the
 * "look-alike" moat. A versioned text block (prepended to model prompts) plus the
 * brand reference images (image-to-image). Pure aggregator over the existing
 * helpers; brand data is already clamped at write time, so this is safe to inject
 * everywhere. Computed ONCE per run in the runner and passed via `ModuleContext`.
 */
export interface BrandContext {
  /** Versioned brand block to prepend to text prompts. */
  promptBlock: string;
  /** Safe public reference image URLs for image-to-image consistency. */
  referenceImages: string[];
  /** True when the brand has any usable identity (voice/colors/notes/refs). */
  hasIdentity: boolean;
}

export function buildBrandContext(
  brand: BrandProfile | null | undefined,
  fallbackTone = "profesionalan",
): BrandContext {
  const referenceImages = brandReferenceImages(brand);
  const colors = colorsToStrings(brand?.colors);
  const hasIdentity = Boolean(
    brand &&
      ((brand.voice?.trim()?.length ?? 0) > 0 ||
        colors.length > 0 ||
        (brand.notes?.trim()?.length ?? 0) > 0 ||
        referenceImages.length > 0),
  );
  const promptBlock = `[brend v${BRAND_CONTEXT_VERSION}] ${brandPromptLine(brand, fallbackTone)}`;
  return { promptBlock, referenceImages, hasIdentity };
}
