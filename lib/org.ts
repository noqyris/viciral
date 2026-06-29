import { Prisma, type OrgRole } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Organization (= brand workspace) helpers. The org carries the brand identity;
 * a user can belong to many orgs (Membership + role, team-ready). Credits stay
 * on the user (shared). These wrap the active-org resolution + RBAC.
 */

/** Slugify a brand/org name into a URL-safe slug. */
export function slugifyOrg(name: string): string {
  const base = (name || "brand")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "brand";
}

/** A slug not yet taken (appends a counter on collision). */
async function uniqueOrgSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export interface CreateOrgInput {
  userId: string;
  name: string;
  colors?: Prisma.InputJsonValue;
  voice?: string | null;
  logoUrl?: string | null;
  referenceImages?: Prisma.InputJsonValue;
  notes?: string | null;
  personal?: boolean;
}

/** Create an organization (a brand) + the creator's OWNER membership. */
export async function createOrg(input: CreateOrgInput) {
  const slug = await uniqueOrgSlug(slugifyOrg(input.name));
  return prisma.organization.create({
    data: {
      slug,
      name: input.name.trim() || "Brand",
      colors: input.colors,
      voice: input.voice ?? undefined,
      logoUrl: input.logoUrl ?? undefined,
      referenceImages: input.referenceImages,
      notes: input.notes ?? undefined,
      personal: input.personal ?? false,
      members: { create: { userId: input.userId, role: "OWNER" } },
    },
  });
}

/**
 * Ensure a user has at least one org; create a default personal one if not.
 * Idempotent — safe on every signup and as a layout-level safety net. Returns
 * the user's default org (personal first, then oldest).
 */
export async function ensureUserHasOrg(userId: string) {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    orderBy: [{ organization: { personal: "desc" } }, { createdAt: "asc" }],
    include: { organization: true },
  });
  if (existing) return existing.organization;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const name = user?.name?.trim() || user?.email?.split("@")[0] || "My brand";
  return createOrg({ userId, name, personal: true });
}

/** All orgs the user belongs to, with their role — for the org/brand switcher. */
export async function getUserOrgs(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: [{ organization: { personal: "desc" } }, { organization: { name: "asc" } }],
    include: { organization: true },
  });
  return memberships.map((m) => ({ ...m.organization, role: m.role }));
}

/**
 * Resolve an org by slug AND verify the user is a member. Returns null when the
 * org doesn't exist or the user isn't a member (the membership guard — never
 * trust the URL slug alone).
 */
export async function getOrgForUser(slug: string, userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, organization: { slug } },
    include: { organization: true },
  });
  return membership ? { ...membership.organization, role: membership.role } : null;
}

const ROLE_RANK: Record<OrgRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

/** Minimal RBAC check (team-ready, simple while solo). */
export function hasRole(role: OrgRole, min: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
