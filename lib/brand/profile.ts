import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BrandProfile } from "@prisma/client";
import type { BrandProfileDraft } from "@/lib/modules/types";
import { clampBrandDraft } from "./normalize";

/**
 * Brand memory: load a user's brand profile to inject into generations.
 * Falls back to the user's default profile when no id is given.
 */
export async function loadBrand(
  userId: string,
  brandId?: string,
): Promise<BrandProfile | null> {
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
 * Saves a Brand Kit result as a BrandProfile (the data moat). Upserts by
 * (userId, name) so re-running Brand Kit for the same brand refreshes it instead
 * of accumulating duplicates. The first brand a user makes becomes their default.
 * Model output is clamped ({@link clampBrandDraft}) to the same bounds as the
 * human form before it touches durable brand memory. Runs in a transaction.
 */
export async function createBrandFromKit(
  userId: string,
  draft: BrandProfileDraft,
  logoUrl?: string,
): Promise<BrandProfile> {
  const brand = clampBrandDraft(draft);
  const colors = (brand.colors ?? undefined) as Prisma.InputJsonValue | undefined;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.brandProfile.findFirst({
      where: { userId, name: brand.name },
      select: { id: true, logoUrl: true },
    });

    if (existing) {
      return tx.brandProfile.update({
        where: { id: existing.id },
        data: {
          voice: brand.voice,
          notes: brand.notes,
          colors,
          logoUrl: logoUrl ?? existing.logoUrl,
        },
      });
    }

    const hasDefault = await tx.brandProfile.findFirst({
      where: { userId, isDefault: true },
      select: { id: true },
    });

    return tx.brandProfile.create({
      data: {
        userId,
        name: brand.name,
        voice: brand.voice,
        notes: brand.notes,
        colors,
        logoUrl,
        isDefault: !hasDefault,
      },
    });
  });
}
