import Link from "next/link";
import { notFound } from "next/navigation";
import { getModuleDef } from "@/lib/modules/registry";
import { SocialPackRunner } from "@/components/social-pack-runner";
import { CinematicRunner } from "@/components/cinematic-runner";

export default async function ModuleRunnerPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const mod = getModuleDef(slug);

  if (!mod) notFound();

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
      ) : slug === "social-pack" ? (
        <SocialPackRunner supportsAuto={mod.supportsAuto} />
      ) : slug === "cinematic" ? (
        <CinematicRunner />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          Runner za ovaj modul još nije implementiran.
        </div>
      )}
    </main>
  );
}
