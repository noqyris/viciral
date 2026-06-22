import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { providers } from "@/lib/providers";
import { getModuleDef } from "@/lib/modules/registry";
import { debitCredits, refundCredits } from "@/lib/credits/ledger";
import { loadBrand } from "@/lib/brand/profile";
import { AppError } from "@/lib/http";
import { buildAssetKey, isR2Configured, persistFromUrl } from "@/lib/storage/r2";
import type { GeneratedAsset, GenerationMode } from "@/lib/modules/types";

export interface RunModuleInput {
  userId: string;
  moduleSlug: string;
  mode: GenerationMode;
  inputs: unknown;
  brandId?: string;
}

type PersistedAsset = GeneratedAsset & { sourceUrl?: string };

/**
 * Persists provider assets to R2 when configured. On failure (or when R2 is not
 * configured) we keep the provider URL so generations still work end-to-end.
 */
async function persistAssets(
  generationId: string,
  assets: GeneratedAsset[],
): Promise<PersistedAsset[]> {
  if (!isR2Configured()) {
    return assets.map((a) => ({ ...a, sourceUrl: a.url }));
  }
  return Promise.all(
    assets.map(async (a, i): Promise<PersistedAsset> => {
      if (!a.url || a.kind === "text") return { ...a, sourceUrl: a.url };
      try {
        const url = await persistFromUrl(a.url, buildAssetKey(generationId, i, a.kind));
        return { ...a, sourceUrl: a.url, url };
      } catch (err) {
        console.error(`R2 persist failed (asset ${i}, gen ${generationId}):`, err);
        return { ...a, sourceUrl: a.url };
      }
    }),
  );
}

/**
 * Runs one module with a reserve → run → reconcile credit flow:
 *  1. Reserve a conservative upfront estimate (atomic debit; fails fast if the
 *     balance is too low — no provider call happens).
 *  2. Run the module; each paid step reports cost via `ctx.spend`.
 *  3. Persist assets + flip status atomically, then refund the unused reservation.
 *
 * On failure we charge for work actually done and refund the rest, so a partial
 * run can never be free, and a failed debit can never leave free output.
 */
export async function runModule(run: RunModuleInput) {
  const mod = getModuleDef(run.moduleSlug);
  if (!mod || mod.status !== "available") {
    throw new AppError(`Modul nije dostupan: ${run.moduleSlug}`, 400);
  }

  const inputs = mod.inputSchema.parse(run.inputs);
  const estimate = mod.estimateCredits(inputs);

  const generation = await prisma.generation.create({
    data: {
      userId: run.userId,
      module: run.moduleSlug,
      mode: run.mode,
      status: "PENDING",
      inputs: inputs as Prisma.InputJsonValue,
      creditsEst: estimate,
    },
  });

  // 1. Reserve the estimate atomically. Throws InsufficientCreditsError if low.
  try {
    await debitCredits(run.userId, estimate, "reserve", generation.id);
  } catch (err) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", error: (err as Error).message },
    });
    throw err;
  }

  // 2. Run, accumulating actual spend (survives a mid-run throw). Everything
  // after the reservation is refund-protected, so a failure anywhere returns
  // the unused hold.
  let actualUsed = 0;
  const spend = (credits: number) => {
    actualUsed += Math.max(0, Math.ceil(credits));
  };

  try {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "RUNNING" },
    });

    const brand = await loadBrand(run.userId, run.brandId);
    const result = await mod.generate({
      userId: run.userId,
      mode: run.mode,
      inputs,
      brand,
      providers,
      spend,
    });

    // Trust ctx.spend; fall back to the returned total if the module didn't report.
    if (actualUsed === 0 && result.creditsUsed > 0) actualUsed = result.creditsUsed;
    // Never charge more than was reserved (estimate is a conservative upper bound).
    const charged = Math.min(actualUsed, estimate);

    const persisted = await persistAssets(generation.id, result.assets);

    // 3. Persist outputs + final status atomically.
    await prisma.$transaction(async (tx) => {
      await tx.asset.createMany({
        data: persisted.map((a) => ({
          generationId: generation.id,
          kind: a.kind,
          url: a.url,
          sourceUrl: a.sourceUrl,
          text: a.text,
          modelId: a.modelId,
          meta: (a.meta ?? undefined) as Prisma.InputJsonValue | undefined,
        })),
      });
      await tx.generation.update({
        where: { id: generation.id },
        data: { status: "COMPLETED", creditsUsed: charged },
      });
    });

    const refund = estimate - charged;
    if (refund > 0) {
      await refundCredits(run.userId, refund, "reconcile", generation.id);
    }

    return prisma.generation.findUniqueOrThrow({
      where: { id: generation.id },
      include: { assets: true },
    });
  } catch (err) {
    // Charge for work actually performed; refund the rest of the reservation.
    const charged = Math.min(actualUsed, estimate);
    const refund = estimate - charged;
    if (refund > 0) {
      await refundCredits(run.userId, refund, "refund-failed", generation.id);
    }
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", creditsUsed: charged, error: (err as Error).message },
    });
    throw err;
  }
}
