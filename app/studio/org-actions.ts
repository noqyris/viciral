"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createOrg, getOrgForUser } from "@/lib/org";
import { ACTIVE_ORG_COOKIE } from "@/lib/active-org";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

function setOrgCookie(jar: Awaited<ReturnType<typeof cookies>>, slug: string) {
  jar.set(ACTIVE_ORG_COOKIE, slug, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Switch the active brand/org (membership-guarded). */
export async function setActiveOrg(slug: string) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const org = await getOrgForUser(slug, userId);
  if (org) setOrgCookie(await cookies(), org.slug);
  redirect("/studio");
}

/** Create a new brand/org for the current user and switch to it. */
export async function createBrand(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) redirect("/studio");
  const org = await createOrg({ userId, name });
  setOrgCookie(await cookies(), org.slug);
  redirect("/studio");
}
