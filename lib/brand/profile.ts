import { prisma } from "@/lib/db";
import type { BrandProfile } from "@prisma/client";

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
