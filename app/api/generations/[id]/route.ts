import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AppError, jsonError } from "@/lib/http";

export const runtime = "nodejs";

/** Generation status + assets, scoped to the current user (used for async polling). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const generation = await prisma.generation.findFirst({
      where: { id, userId: user.id },
      include: { assets: true },
    });
    if (!generation) throw new AppError("Generacija nije pronađena", 404);

    return NextResponse.json({
      generation: {
        id: generation.id,
        module: generation.module,
        status: generation.status,
        creditsUsed: generation.creditsUsed,
        error: generation.error,
        assets: generation.assets.map((a) => ({
          id: a.id,
          kind: a.kind,
          url: a.url,
          text: a.text,
          jobStatus: a.jobStatus,
        })),
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
