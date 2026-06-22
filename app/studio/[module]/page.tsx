import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModuleDef } from "@/lib/modules/registry";
import type { ModuleDef } from "@/lib/modules/types";
import { SocialPackRunner } from "@/components/social-pack-runner";
import { CinematicRunner } from "@/components/cinematic-runner";
import { BrandKitRunner } from "@/components/brand-kit-runner";

// Slug → runner. Each entry owns its own props, so adding a module is a one-line
// addition here (the registry owns everything else).
const RUNNERS: Record<string, (mod: ModuleDef) => ReactNode> = {
  "social-pack": (mod) => <SocialPackRunner supportsAuto={mod.supportsAuto} />,
  cinematic: () => <CinematicRunner />,
  "brand-kit": (mod) => <BrandKitRunner supportsAuto={mod.supportsAuto} />,
};

export default async function ModuleRunnerPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const mod = getModuleDef(slug);

  if (!mod) notFound();

  const renderRunner = RUNNERS[slug];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/studio" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Studio
      </Link>

      <header className="mt-4 mb-8 flex items-center gap-3">
        <span className="text-3xl">{mod.icon}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{mod.name}</h1>
          <p className="text-zinc-600">{mod.tagline}</p>
        </div>
      </header>

      {mod.status !== "available" ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          Ovaj modul je u izradi i biće uskoro dostupan.
        </div>
      ) : renderRunner ? (
        renderRunner(mod)
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          Runner za ovaj modul još nije implementiran.
        </div>
      )}
    </main>
  );
}
