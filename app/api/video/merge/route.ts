import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveOrg } from "@/lib/active-org";
import { providers } from "@/lib/providers";
import { debitCredits, refundCredits } from "@/lib/credits/ledger";
import { estimateCredits } from "@/lib/credits/pricing";
import { AppError, jsonError, readJsonBody, isHttpUrl } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Merges the finished clips of a video chain into one video (fal ffmpeg), in the
 * given order. Auth-gated and charged a small credit (refunded on provider
 * failure). Pass `totalSec` so the charge tracks the merged output length.
 */
export async function POST(req: Request) {
  try {
    const body = await readJsonBody<{ videoUrls?: unknown; totalSec?: number }>(req);
    const urls = Array.isArray(body.videoUrls) ? body.videoUrls.filter(isHttpUrl) : [];
    if (urls.length < 2) throw new AppError("Potrebna su najmanje dva klipa za spajanje", 400);
    if (!providers.video.mergeVideos) throw new AppError("Operacija nije dostupna", 500);

    const user = await getCurrentUser();
    const org = await getActiveOrg(user.id);

    const totalSec =
      typeof body.totalSec === "number" && body.totalSec > 0 ? body.totalSec : urls.length * 10;
    const cost = estimateCredits("ffmpeg-merge", { durationSec: totalSec });
    await debitCredits(user.id, cost, "video-chain-merge", undefined, org.id);
    try {
      const finalUrl = await providers.video.mergeVideos(urls);
      return NextResponse.json({ finalUrl, creditsUsed: cost });
    } catch (err) {
      await refundCredits(user.id, cost, "video-chain-merge-failed", undefined, undefined, org.id);
      throw err;
    }
  } catch (err) {
    return jsonError(err);
  }
}
