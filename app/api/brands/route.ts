import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listBrands } from "@/lib/brand/profile";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1, "Naziv je obavezan").max(80),
  voice: z.string().max(200).optional(),
  colors: z.array(z.string().max(40)).max(12).optional(),
  notes: z.string().max(1000).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    const brands = await listBrands(user.id);
    return NextResponse.json({ brands });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = createSchema.parse(await req.json());

    const brand = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.brandProfile.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.brandProfile.create({
        data: {
          userId: user.id,
          name: body.name,
          voice: body.voice,
          notes: body.notes,
          colors: (body.colors ?? undefined) as Prisma.InputJsonValue | undefined,
          isDefault: body.isDefault ?? false,
        },
      });
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
