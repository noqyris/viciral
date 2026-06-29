"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getActiveOrg } from "@/lib/active-org";

function parseColors(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => (c.startsWith("#") ? c : `#${c}`))
    .filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c))
    .slice(0, 8);
}

function parseUrls(raw: string): string[] {
  return raw
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .slice(0, 12);
}

/** Update the active brand/org's identity (the brand memory injected into runs). */
export async function updateBrandIdentity(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const org = await getActiveOrg(userId);

  const name = String(formData.get("name") ?? "").trim();
  const voice = String(formData.get("voice") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const colors = parseColors(String(formData.get("colors") ?? ""));
  const referenceImages = parseUrls(String(formData.get("referenceImages") ?? ""));

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      ...(name.length >= 2 ? { name } : {}),
      voice: voice || null,
      notes: notes || null,
      logoUrl: logoUrl && /^https?:\/\//i.test(logoUrl) ? logoUrl : null,
      colors: colors as Prisma.InputJsonValue,
      referenceImages: referenceImages as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/studio/brand");
}

/** Set the active brand/org's logo to a generated logo URL (from the Logo builder). */
export async function setBrandLogo(url: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  if (!/^https?:\/\//i.test(url)) return;
  const org = await getActiveOrg(userId);
  await prisma.organization.update({ where: { id: org.id }, data: { logoUrl: url } });
  revalidatePath("/studio/brand");
}
