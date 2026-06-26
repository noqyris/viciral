import { prisma } from "@/lib/db";
import { refundCredits } from "@/lib/credits/ledger";
import { estimateCredits, type UsageParams } from "@/lib/credits/pricing";
import { buildAssetKey, isR2Configured, persistFromUrl } from "@/lib/storage/r2";

/**
 * Splits a reservation into the amount to charge and the amount to refund.
 * Never charges more than was reserved; the estimate is a conservative bound.
 */
export function reconcileCharge(
  reserved: number,
  alreadyCharged: number,
  actual: number,
): { charged: number; refund: number } {
  const charged = Math.min(alreadyCharged + Math.max(0, actual), reserved);
  return { charged, refund: Math.max(0, reserved - charged) };
}

export interface VideoJobResult {
  status: "completed" | "failed";
  videoUrl?: string;
  error?: string;
  /** Actual output dimensions, if the provider reports them (margin accuracy). */
  width?: number;
  height?: number;
}

/**
 * Settles an async video job (from the fal webhook or the reaper). Fully
 * idempotent and crash-recoverable: it does NOT use a one-way claim, so a
 * delivery that crashes mid-settle is simply re-run by the next delivery. The
 * refund carries a per-generation idempotency key, so it can never double-refund;
 * the asset + generation updates commit in one transaction, so a crash can never
 * leave the asset terminal while the generation is still RUNNING (which the
 * fast-path guard below keys off, and the reaper can't recover).
 */
export async function settleVideoJob(requestId: string, result: VideoJobResult) {
  const asset = await prisma.asset.findFirst({ where: { providerJobId: requestId } });
  if (!asset) return { skipped: "unknown job" as const };

  // Fast-path idempotency: already in a terminal state — nothing to do.
  if (asset.jobStatus === "completed" || asset.jobStatus === "failed") {
    return { skipped: "already settled" as const };
  }

  const generation = await prisma.generation.findUniqueOrThrow({
    where: { id: asset.generationId },
  });

  const reserved = generation.creditsEst;
  const meta = (asset.meta ?? {}) as unknown as {
    params?: UsageParams;
    preSpent?: number;
  };
  // Stable basis (does not read the mutable generation.creditsUsed), so re-runs
  // compute the same charge.
  const preSpent = typeof meta.preSpent === "number" ? meta.preSpent : 0;
  const refundKey = `settle:${generation.id}`;

  if (result.status === "failed" || !result.videoUrl) {
    const { charged, refund } = reconcileCharge(reserved, preSpent, 0);
    if (refund > 0) {
      await refundCredits(generation.userId, refund, "video-failed", generation.id, refundKey);
    }
    await prisma.$transaction([
      prisma.asset.update({ where: { id: asset.id }, data: { jobStatus: "failed" } }),
      prisma.generation.update({
        where: { id: generation.id },
        data: { status: "FAILED", creditsUsed: charged, error: result.error ?? "Video nije uspeo" },
      }),
    ]);
    return { ok: true, status: "failed" as const };
  }

  // Persist the clip to R2 (best-effort; keep provider URL on failure).
  let url = result.videoUrl;
  if (isR2Configured()) {
    try {
      url = await persistFromUrl(result.videoUrl, buildAssetKey(generation.id, 0, "video"));
    } catch (err) {
      console.error("R2 video persist failed:", err);
    }
  }

  const modelId = asset.modelId ?? "seedance-2";
  const params: UsageParams = { ...(meta.params ?? {}) };
  if (result.width) params.width = result.width;
  if (result.height) params.height = result.height;
  const actual = estimateCredits(modelId, params);

  const { charged, refund } = reconcileCharge(reserved, preSpent, actual);
  if (refund > 0) {
    await refundCredits(generation.userId, refund, "video-reconcile", generation.id, refundKey);
  }

  await prisma.$transaction([
    prisma.asset.update({
      where: { id: asset.id },
      data: { jobStatus: "completed", url, sourceUrl: result.videoUrl },
    }),
    prisma.generation.update({
      where: { id: generation.id },
      data: { status: "COMPLETED", creditsUsed: charged },
    }),
  ]);
  return { ok: true, status: "completed" as const };
}
