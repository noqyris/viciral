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
} as const;

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

  return {
    name: draft.name.trim().slice(0, BRAND_LIMITS.name),
    voice: voice || undefined,
    notes: notes || undefined,
    colors: colors.length ? colors : undefined,
  };
}
