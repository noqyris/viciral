import type { Generation, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { providers } from "@/lib/providers";
import { getModuleDef } from "@/lib/modules/registry";
import { debitCredits, refundCredits } from "@/lib/credits/ledger";
import { createBrandFromKit, loadBrand } from "@/lib/brand/profile";
import { AppError } from "@/lib/http";
import { reconcileCharge } from "@/lib/jobs/settle";
import { rewriteEmbeddedUrls } from "@/lib/jobs/rewrite";
import { buildAssetKey, isR2Configured, persistFromUrl } from "@/lib/storage/r2";
import type { GeneratedAsset, GenerationMode, ModuleDef } from "@/lib/modules/types";

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

/** Create a PENDING generation and atomically reserve the estimate (fails fast if low). */
async function createAndReserve(
  run: RunModuleInput,
  inputs: unknown,
  estimate: number,
): Promise<Generation> {
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
  try {
    await debitCredits(run.userId, estimate, "reserve", generation.id);
  } catch (err) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", error: (err as Error).message },
    });
    throw err;
  }
  return generation;
}

/** Charge for work done, refund the rest of the reservation, mark FAILED. Idempotent refund. */
async function failGeneration(
  userId: string,
  generationId: string,
  spent: number,
  estimate: number,
  err: unknown,
) {
  const { charged, refund } = reconcileCharge(estimate, spent, 0);
  if (refund > 0) {
    await refundCredits(userId, refund, "refund-failed", generationId, `settle:${generationId}`);
  }
  await prisma.generation.update({
    where: { id: generationId },
    data: { status: "FAILED", creditsUsed: charged, error: (err as Error).message },
  });
}

/**
 * Entry point. Validates inputs, computes a conservative estimate, then runs the
 * module via the sync (inline) or async (submit → webhook) path.
 */
export async function runModule(run: RunModuleInput) {
  const mod = getModuleDef(run.moduleSlug);
  if (!mod || mod.status !== "available") {
    throw new AppError(`Modul nije dostupan: ${run.moduleSlug}`, 400);
  }

  const inputs = mod.inputSchema.parse(run.inputs);
  const estimate = mod.estimateCredits(inputs);

  return mod.kind === "async"
    ? runAsyncModule(run, mod, inputs, estimate)
    : runSyncModule(run, mod, inputs, estimate);
}

/**
 * Sync flow: reserve → run inline → persist + status atomically → refund unused.
 * On failure we charge for work actually done and refund the rest.
 */
async function runSyncModule(
  run: RunModuleInput,
  mod: ModuleDef,
  inputs: unknown,
  estimate: number,
) {
  if (!mod.generate) throw new AppError(`Modul ${run.moduleSlug} nije izvršiv`, 500);

  const generation = await createAndReserve(run, inputs, estimate);

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

    if (actualUsed === 0 && result.creditsUsed > 0) actualUsed = result.creditsUsed;
    const { charged, refund } = reconcileCharge(estimate, 0, actualUsed);

    const persisted = rewriteEmbeddedUrls(await persistAssets(generation.id, result.assets));

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

    if (refund > 0) {
      await refundCredits(run.userId, refund, "reconcile", generation.id, `settle:${generation.id}`);
    }

    // Brand-memory side effect (Brand Kit): save the result as a BrandProfile,
    // wiring the generated logo's persisted URL. Best-effort — the generation is
    // already paid for and COMPLETED, so a brand-write failure must not fail it.
    if (result.brandProfile) {
      try {
        const logo = persisted.find((a) => a.kind === "image" && a.meta?.role === "logo");
        const avatar = persisted.find((a) => a.kind === "image" && a.meta?.role === "avatar");
        // Seed the brand's character reference from its generated avatar (and
        // logo) so future generations can stay visually consistent with it.
        const referenceImages = [avatar?.url, logo?.url].filter(
          (u): u is string => typeof u === "string" && u.length > 0,
        );
        await createBrandFromKit(run.userId, result.brandProfile, logo?.url, referenceImages);
      } catch (err) {
        console.error(`Brand kit: saving BrandProfile failed (gen ${generation.id}):`, err);
      }
    }

    return prisma.generation.findUniqueOrThrow({
      where: { id: generation.id },
      include: { assets: true },
    });
  } catch (err) {
    await failGeneration(run.userId, generation.id, actualUsed, estimate, err);
    throw err;
  }
}

/**
 * Async flow: reserve → submit a queued provider job → persist a pending asset
 * (carrying the stable pre-spend) and leave the generation RUNNING. The fal
 * webhook settles it later (lib/jobs/settle.ts); a reaper backstops lost webhooks.
 */
async function runAsyncModule(
  run: RunModuleInput,
  mod: ModuleDef,
  inputs: unknown,
  estimate: number,
) {
  if (!mod.submit) throw new AppError(`Modul ${run.moduleSlug} nema async submit`, 500);

  const generation = await createAndReserve(run, inputs, estimate);

  // Credits spent synchronously during submit (e.g. a pre-generated image).
  let preSpent = 0;
  const spend = (credits: number) => {
    preSpent += Math.max(0, Math.ceil(credits));
  };

  try {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "RUNNING" },
    });

    const brand = await loadBrand(run.userId, run.brandId);
    const submitResult = await mod.submit({
      userId: run.userId,
      mode: run.mode,
      inputs,
      brand,
      providers,
      spend,
    });

    const chargedPre = Math.min(preSpent, estimate);

    try {
      await prisma.asset.create({
        data: {
          generationId: generation.id,
          kind: "video",
          jobStatus: "queued",
          providerJobId: submitResult.requestId,
          modelId: submitResult.modelId,
          // preSpent is the stable settlement basis read by the webhook.
          meta: { params: submitResult.params, preSpent: chargedPre } as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.error(
        `Orphaned fal job ${submitResult.requestId} (pending asset insert failed); refunding.`,
      );
      throw err;
    }

    if (chargedPre > 0) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { creditsUsed: chargedPre },
      });
    }

    return prisma.generation.findUniqueOrThrow({
      where: { id: generation.id },
      include: { assets: true },
    });
  } catch (err) {
    await failGeneration(run.userId, generation.id, preSpent, estimate, err);
    throw err;
  }
}
