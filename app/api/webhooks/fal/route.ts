import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * fal.ai queue webhook — called when an async job (e.g. Seedance video)
 * completes. We match the asset by `providerJobId`, persist the output URL, and
 * mark it completed. The cinematic module (Phase 2) submits jobs with a webhook
 * URL pointing here.
 *
 * TODO: verify the fal webhook signature (FAL_WEBHOOK_SECRET) before trusting
 * the payload once the cinematic module is wired up.
 */
export async function POST(req: Request) {
  const payload = (await req.json()) as {
    request_id?: string;
    status?: string;
    payload?: { video?: { url?: string } };
    error?: unknown;
  };

  const requestId = payload.request_id;
  if (!requestId) {
    return NextResponse.json({ error: "missing request_id" }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({
    where: { providerJobId: requestId },
  });
  if (!asset) {
    return NextResponse.json({ received: true, skipped: "unknown job" });
  }

  const failed = payload.status === "ERROR" || payload.error != null;
  const videoUrl = payload.payload?.video?.url;

  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      jobStatus: failed ? "failed" : "completed",
      sourceUrl: videoUrl ?? asset.sourceUrl,
      url: videoUrl ?? asset.url,
    },
  });

  return NextResponse.json({ received: true });
}
