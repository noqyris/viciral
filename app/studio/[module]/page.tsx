import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModuleDef } from "@/lib/modules/registry";
import type { ModuleDef } from "@/lib/modules/types";
import { getTemplate, templatesFor } from "@/lib/templates/registry";
import { SocialPackRunner } from "@/components/social-pack-runner";
import { CinematicRunner } from "@/components/cinematic-runner";
import { BrandKitRunner } from "@/components/brand-kit-runner";
import { WebsiteRunner } from "@/components/website-runner";
import { ImageToolsRunner } from "@/components/image-tools-runner";
import { ShortFormRunner } from "@/components/short-form-runner";
import { EditorRunner } from "@/components/editor-runner";
import { AvatarRunner } from "@/components/avatar-runner";
import { DubbingRunner } from "@/components/dubbing-runner";
import { MusicRunner } from "@/components/music-runner";
import { ImageRunner } from "@/components/image-runner";
import { LogoRunner } from "@/components/logo-runner";
import { AppBuilderRunner } from "@/components/app-builder-runner";
import { ModuleIcon, TemplateIcon } from "@/components/icons";
import { getLocale } from "@/lib/i18n-server";
import { moduleName, moduleTagline } from "@/lib/modules/i18n";

const T = {
  sr: {
    backToStudio: "← Studio",
    quickStart: "Recepti za brz start",
    inProgress: "Ovaj modul je u izradi i biće uskoro dostupan.",
    notImplemented: "Runner za ovaj modul još nije implementiran.",
  },
  en: {
    backToStudio: "← Studio",
    quickStart: "Quick-start recipes",
    inProgress: "This module is being built and will be available soon.",
    notImplemented: "The runner for this module isn't implemented yet.",
  },
} as const;

type Initial = Record<string, unknown> | undefined;

// Slug → runner. Each entry owns its own props, so adding a module is a one-line
// addition here (the registry owns everything else). `initial` seeds the form
// from a chosen template; runners that don't take templates ignore it.
const RUNNERS: Record<string, (mod: ModuleDef, initial: Initial) => ReactNode> = {
  "social-pack": (mod, initial) => (
    <SocialPackRunner supportsAuto={mod.supportsAuto} initialInputs={initial} />
  ),
  cinematic: () => <CinematicRunner />,
  "brand-kit": (mod) => <BrandKitRunner supportsAuto={mod.supportsAuto} />,
  website: (mod, initial) => (
    <WebsiteRunner supportsAuto={mod.supportsAuto} initialInputs={initial} />
  ),
  "image-tools": (_mod, initial) => <ImageToolsRunner initialInputs={initial} />,
  "short-form": (mod, initial) => (
    <ShortFormRunner supportsAuto={mod.supportsAuto} initialInputs={initial} />
  ),
  editor: () => <EditorRunner />,
  avatar: (_mod, initial) => <AvatarRunner initialInputs={initial} />,
  dubbing: (_mod, initial) => <DubbingRunner initialInputs={initial} />,
  music: (_mod, initial) => <MusicRunner initialInputs={initial} />,
  image: (_mod, initial) => <ImageRunner initialInputs={initial} />,
  logo: (_mod, initial) => <LogoRunner initialInputs={initial} />,
  "app-builder": (_mod, initial) => <AppBuilderRunner initialInputs={initial} />,
};

export default async function ModuleRunnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { module: slug } = await params;
  const { template: templateId } = await searchParams;
  const mod = getModuleDef(slug);

  if (!mod) notFound();

  const locale = await getLocale();
  const t = T[locale];

  const renderRunner = RUNNERS[slug];
  const templates = templatesFor(slug);
  const active = templateId ? getTemplate(templateId, slug) : undefined;
  const initial = active?.inputs;

  return (
    <main className="relative mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      {/* Ambient top glow — same lit feel as the studio hub + landing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(99,102,241,0.12),transparent_70%)]"
      />

      <Link
        href="/studio"
        className="relative inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        {t.backToStudio}
      </Link>

      <header className="relative mb-8 mt-5 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_10px_34px_-10px_rgba(139,92,246,0.85)]">
          <ModuleIcon slug={mod.slug} className="size-6 text-white" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {moduleName(mod.slug, locale, mod.name)}
            </h1>
            {mod.supportsAuto && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-400/20">
                Auto
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-pretty leading-relaxed text-zinc-400">
            {moduleTagline(mod.slug, locale, mod.tagline)}
          </p>
        </div>
      </header>

      {mod.status === "available" && templates.length > 0 && (
        <div className="relative mb-8">
          <div className="mb-2 field-label">{t.quickStart}</div>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => {
              const isActive = active?.id === tpl.id;
              return (
                <Link
                  key={tpl.id}
                  href={`/studio/${slug}?template=${tpl.id}`}
                  title={tpl.description[locale]}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                    isActive
                      ? "border-violet-400/30 bg-violet-500/15 font-medium text-violet-200"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-violet-400/30 hover:text-violet-200"
                  }`}
                >
                  <TemplateIcon name={tpl.icon} className="h-4 w-4" />
                  {tpl.title[locale]}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {mod.status !== "available" ? (
        <div className="relative rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-zinc-400">
          {t.inProgress}
        </div>
      ) : renderRunner ? (
        // `key` forces the runner to remount when the template changes, so the
        // form re-seeds from the newly selected template's inputs.
        <div key={active?.id ?? "blank"} className="relative">
          {renderRunner(mod, initial)}
        </div>
      ) : (
        <div className="relative rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-zinc-400">
          {t.notImplemented}
        </div>
      )}
    </main>
  );
}
