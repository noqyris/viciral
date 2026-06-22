import { prisma } from "@/lib/db";
import { falVideoProvider } from "@/lib/providers/fal";
import { settleVideoJob } from "@/lib/jobs/settle";

/**
 * Backstop for async video jobs whose webhook never arrived (fal dropped it, the
 * endpoint was down, etc.). Polls fal for queued video assets on still-RUNNING
 * generations and settles them through the same idempotent {@link settleVideoJob}
 * path; past a hard deadline it refunds the held reservation. Call from a cron.
 */
export async function reapStuckJobs(opts?: {
  staleMs?: number;
  deadMs?: number;
  limit?: number;
}) {
  const staleMs = opts?.staleMs ?? 5 * 60_000; // start checking after 5 min
  const deadMs = opts?.deadMs ?? 60 * 60_000; // give up + refund after 1 h
  const limit = opts?.limit ?? 50;
  const cutoff = new Date(Date.now() - staleMs);

  const stuck = await prisma.asset.findMany({
    where: {
      kind: "video",
      jobStatus: "queued",
      providerJobId: { not: null },
      createdAt: { lt: cutoff },
      generation: { status: "RUNNING" },
    },
    take: limit,
  });

  let settled = 0;
  let refunded = 0;
  let skipped = 0;

  for (const asset of stuck) {
    const requestId = asset.providerJobId;
    if (!requestId) continue;
    const modelId = asset.modelId ?? "seedance-2";
    const ageMs = Date.now() - asset.createdAt.getTime();

    try {
      const res = await falVideoProvider.fetchResult(requestId, modelId);
      if (res.status === "completed" && res.videoUrl) {
        await settleVideoJob(requestId, { status: "completed", videoUrl: res.videoUrl });
        settled++;
      } else if (res.status === "failed" || ageMs > deadMs) {
        await settleVideoJob(requestId, {
          status: "failed",
          error: res.error ?? "Isteklo vreme",
        });
        refunded++;
      } else {
        skipped++; // still running, not past the deadline yet
      }
    } catch (err) {
      // Provider unreachable. Past the hard deadline, refund so credits aren't
      // stuck forever; otherwise try again next sweep.
      if (ageMs > deadMs) {
        await settleVideoJob(requestId, {
          status: "failed",
          error: "Isteklo vreme (provider nedostupan)",
        });
        refunded++;
      } else {
        console.error(`Reaper: fetchResult failed for ${requestId}:`, err);
        skipped++;
      }
    }
  }

  return { checked: stuck.length, settled, refunded, skipped };
}
