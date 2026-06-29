import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BrandProfile } from "@prisma/client";
import type { BrandProfileDraft } from "@/lib/modules/types";
import { clampBrandDraft } from "./normalize";

/**
 * Brand memory injected into generations. org = brand: prefer the ACTIVE
 * organization's identity (colors/voice/logo/reference images). Falls back to the
 * legacy per-user BrandProfile only when no org is given (deprecated path).
 */
export async function loadBrand(
  userId: string,
  organizationId?: string,
  brandId?: string,
): Promise<BrandProfile | null> {
  if (organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (org) {
      // Map the org onto the BrandProfile shape the modules already consume.
      return {
        id: org.id,
        userId,
        name: org.name,
        colors: org.colors,
        voice: org.voice,
        logoUrl: org.logoUrl,
        referenceImages: org.referenceImages,
        fonts: org.fonts,
        notes: org.notes,
        isDefault: org.personal,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      };
    }
  }
  // Legacy fallback (per-user BrandProfile) — kept until fully removed.
  if (brandId) {
    return prisma.brandProfile.findFirst({ where: { id: brandId, userId } });
  }
  return prisma.brandProfile.findFirst({ where: { userId, isDefault: true } });
}

/** Lists a user's brands in display order (default first, then newest). */
export function listBrands(userId: string): Promise<BrandProfile[]> {
  return prisma.brandProfile.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Saves a Brand Kit result into the ACTIVE organization's brand identity (the
 * data moat — org = brand). Fills voice/notes/colors/logo and seeds the brand's
 * reference images so later generations stay visually consistent. Model output is
 * clamped ({@link clampBrandDraft}) to the same bounds as the human form. The
 * brand kit does NOT rename the workspace — the user names the org.
 */
export async function createBrandFromKit(
  organizationId: string,
  draft: BrandProfileDraft,
  logoUrl?: string,
  referenceImages?: string[],
) {
  const brand = clampBrandDraft({ ...draft, referenceImages });
  const colors = (brand.colors ?? undefined) as Prisma.InputJsonValue | undefined;
  const refs = (brand.referenceImages ?? undefined) as Prisma.InputJsonValue | undefined;

  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      voice: brand.voice,
      notes: brand.notes,
      colors,
      // Only overwrite logo / references when this run produced them.
      ...(logoUrl ? { logoUrl } : {}),
      ...(refs !== undefined ? { referenceImages: refs } : {}),
    },
  });
}
