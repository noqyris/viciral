import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { referenceImagesToStrings } from "@/lib/brand/normalize";
import { AppError, jsonError } from "@/lib/http";

export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  voice: z.string().max(200).nullable().optional(),
  colors: z.array(z.string().max(40)).max(12).optional(),
  notes: z.string().max(1000).nullable().optional(),
  referenceImages: z.array(z.string().url().max(600)).max(6).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const existing = await prisma.brandProfile.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new AppError("Brend nije pronađen", 404);

    const brand = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.brandProfile.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.brandProfile.update({
        where: { id },
        data: {
          name: body.name,
          voice: body.voice,
          notes: body.notes,
          colors:
            body.colors !== undefined
              ? (body.colors as Prisma.InputJsonValue)
              : undefined,
          referenceImages:
            body.referenceImages !== undefined
              ? (referenceImagesToStrings(body.referenceImages) as Prisma.InputJsonValue)
              : undefined,
          isDefault: body.isDefault,
        },
      });
    });

    return NextResponse.json({ brand });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const existing = await prisma.brandProfile.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new AppError("Brend nije pronađen", 404);

    await prisma.brandProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
