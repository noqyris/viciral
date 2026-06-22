import type { BrandProfile } from "@prisma/client";

/** Coerces the Json `colors` field into a clean string[]. */
export function colorsToStrings(colors: unknown): string[] {
  if (!Array.isArray(colors)) return [];
  return colors.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
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
