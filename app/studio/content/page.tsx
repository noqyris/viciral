import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getModuleDef } from "@/lib/modules/registry";
import { getLocale } from "@/lib/i18n-server";
import { ContentRunner } from "@/components/content-runner";

const T = {
  sr: {
    back: "← Studio",
    title: "Content creation",
    sub: "Napravi sliku, video ili objavu — sve u stilu tvog brenda.",
  },
  en: {
    back: "← Studio",
    title: "Content creation",
    sub: "Make an image, video or post — all in your brand's style.",
  },
} as const;

export default async function ContentPage() {
  const locale = await getLocale();
  const t = T[locale];
  const socialAuto = getModuleDef("social-pack")?.supportsAuto ?? false;

  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(99,102,241,0.12),transparent_70%)]"
      />
      <Link
        href="/studio"
        className="relative inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        {t.back}
      </Link>

      <header className="relative mb-8 mt-5 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_10px_34px_-10px_rgba(139,92,246,0.85)]">
          <Sparkles className="size-6 text-white" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-pretty leading-relaxed text-zinc-400">{t.sub}</p>
        </div>
      </header>

      <div className="relative">
        <ContentRunner socialAuto={socialAuto} />
      </div>
    </main>
  );
}
