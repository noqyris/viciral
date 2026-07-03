import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveOrg } from "@/lib/active-org";
import { providers } from "@/lib/providers";
import { debitCredits, refundCredits } from "@/lib/credits/ledger";
import { estimateCredits } from "@/lib/credits/pricing";
import { AppError, jsonError, readJsonBody, isHttpUrl } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Extracts a finished clip's LAST frame (fal ffmpeg) so it can seed the next clip
 * in a video chain. Auth-gated and charged a small credit (with refund on
 * provider failure) so it can't be abused as a free provider call.
 */
export async function POST(req: Request) {
  try {
    const body = await readJsonBody<{ videoUrl?: string }>(req);
    if (!isHttpUrl(body.videoUrl)) throw new AppError("videoUrl je obavezan", 400);
    if (!providers.video.extractLastFrame) throw new AppError("Operacija nije dostupna", 500);

    const user = await getCurrentUser();
    const org = await getActiveOrg(user.id);

    const cost = estimateCredits("ffmpeg-extract-frame", { numImages: 1 });
    await debitCredits(user.id, cost, "video-chain-extract", undefined, org.id);
    try {
      const frameUrl = await providers.video.extractLastFrame(body.videoUrl);
      return NextResponse.json({ frameUrl, creditsUsed: cost });
    } catch (err) {
      await refundCredits(user.id, cost, "video-chain-extract-failed", undefined, undefined, org.id);
      throw err;
    }
  } catch (err) {
    return jsonError(err);
  }
}
