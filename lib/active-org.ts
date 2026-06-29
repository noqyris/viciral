import { cookies } from "next/headers";
import type { OrgRole } from "@prisma/client";
import { ensureUserHasOrg, getOrgForUser } from "@/lib/org";

/**
 * Active-organization resolution from a cookie (request-scoped — keep this out of
 * lib/org.ts, which is imported by auth events that have no request context).
 * The cookie holds the active org's slug; we ALWAYS re-verify membership via
 * getOrgForUser (never trust the slug alone), and fall back to the user's default.
 */
export const ACTIVE_ORG_COOKIE = "viciral.activeOrg";

export type ActiveOrg = Awaited<ReturnType<typeof getOrgForUser>>;

/** The current user's active org (cookie → membership check → default fallback). */
export async function getActiveOrg(userId: string) {
  const slug = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  if (slug) {
    const org = await getOrgForUser(slug, userId);
    if (org) return org;
  }
  // No (valid) active org cookie → fall back to the default personal org.
  const def = await ensureUserHasOrg(userId);
  return { ...def, role: "OWNER" as OrgRole };
}
