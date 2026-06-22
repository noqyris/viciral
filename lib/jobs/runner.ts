import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { providers } from "@/lib/providers";
import { getModuleDef } from "@/lib/modules/registry";
import { debitCredits, getBalance } from "@/lib/credits/ledger";
import { loadBrand } from "@/lib/brand/profile";
import type { GenerationMode } from "@/lib/modules/types";

export interface RunModuleInput {
  userId: string;
  moduleSlug: string;
  mode: GenerationMode;
  inputs: unknown;
  brandId?: string;
}

/**
 * Orchestrates one module run: validate inputs → estimate + enforce credits →
 * persist a Generation → run the module pipeline → persist assets → debit
 * credits. Synchronous modules (e.g. social-pack) complete inline; async video
 * jobs are handled by the queue/webhook path in a later phase.
 */
export async function runModule(run: RunModuleInput) {
  const mod = getModuleDef(run.moduleSlug);
  if (!mod || mod.status !== "available") {
    throw new Error(`Modul nije dostupan: ${run.moduleSlug}`);
  }

  const inputs = mod.inputSchema.parse(run.inputs);
  const estimate = mod.estimateCredits(inputs);

  const balance = await getBalance(run.userId);
  if (balance < estimate) {
    throw new Error(`Nedovoljno kredita: imaš ${balance}, potrebno ~${estimate}`);
  }

  const generation = await prisma.generation.create({
    data: {
      userId: run.userId,
      module: run.moduleSlug,
      mode: run.mode,
      status: "RUNNING",
      inputs: inputs as Prisma.InputJsonValue,
      creditsEst: estimate,
    },
  });

  try {
    const brand = await loadBrand(run.userId, run.brandId);
    const result = await mod.generate({
      userId: run.userId,
      mode: run.mode,
      inputs,
      brand,
      providers,
    });

    await prisma.asset.createMany({
      data: result.assets.map((a) => ({
        generationId: generation.id,
        kind: a.kind,
        url: a.url,
        text: a.text,
        modelId: a.modelId,
        meta: (a.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      })),
    });

    await debitCredits(
      run.userId,
      result.creditsUsed,
      `generation:${generation.id}`,
      generation.id,
    );

    return prisma.generation.update({
      where: { id: generation.id },
      data: { status: "COMPLETED", creditsUsed: result.creditsUsed },
      include: { assets: true },
    });
  } catch (err) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", error: (err as Error).message },
    });
    throw err;
  }
}
