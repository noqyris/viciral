import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getModuleDef } from "@/lib/modules/registry";
import { getLocale } from "@/lib/i18n-server";
import { moduleName } from "@/lib/modules/i18n";

export const dynamic = "force-dynamic";

type StatusKey = "completed" | "running" | "pending" | "failed";

const STATUS: Record<string, { key: StatusKey; cls: string }> = {
  COMPLETED: { key: "completed", cls: "bg-emerald-500/15 text-emerald-300" },
  RUNNING: { key: "running", cls: "bg-amber-500/15 text-amber-300" },
  PENDING: { key: "pending", cls: "bg-white/10 text-zinc-400" },
  FAILED: { key: "failed", cls: "bg-red-500/15 text-red-300" },
};

const T = {
  sr: {
    title: "Istorija",
    sub: "Tvoje poslednje generacije.",
    completed: "Završeno",
    running: "U toku",
    pending: "Na čekanju",
    failed: "Greška",
    auto: "Auto režim",
    manual: "Ručno",
    credits: "kredita",
    emptyTitle: "Još nema generacija",
    emptyHint: "Napravi prvu objavu, video, brend ili sajt — pojaviće se ovde.",
    openStudio: "Otvori studio →",
    dateLocale: "sr-RS",
  },
  en: {
    title: "History",
    sub: "Your most recent generations.",
    completed: "Completed",
    running: "In progress",
    pending: "Pending",
    failed: "Error",
    auto: "Auto mode",
    manual: "Manual",
    credits: "credits",
    emptyTitle: "No generations yet",
    emptyHint: "Make your first post, video, brand or site — it will show up here.",
    openStudio: "Open studio →",
    dateLocale: "en-US",
  },
} as const;

export default async function HistoryPage() {
  const locale = await getLocale();
  const t = T[locale];
  const user = await getCurrentUser();
  const generations = await prisma.generation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      assets: { where: { kind: { in: ["image", "video", "audio"] } }, take: 4 },
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-100">{t.title}</h1>
      <p className="mb-8 text-zinc-400">{t.sub}</p>

      {generations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <div className="text-3xl">🗂️</div>
          <p className="mt-3 font-medium text-zinc-300">{t.emptyTitle}</p>
          <p className="mt-1 text-sm text-zinc-400">{t.emptyHint}</p>
          <Link
            href="/studio"
            className="mt-5 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            {t.openStudio}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map((g) => {
            const status = STATUS[g.status] ?? STATUS.PENDING;
            const mod = getModuleDef(g.module);
            return (
              <div key={g.id} className="surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-zinc-100">
                    {mod?.icon && <span aria-hidden>{mod.icon}</span>}
                    {mod ? moduleName(mod.slug, locale, mod.name) : g.module}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}
                  >
                    {t[status.key]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {g.mode === "auto" ? t.auto : t.manual} · {g.creditsUsed} {t.credits} ·{" "}
                  {g.createdAt.toLocaleString(t.dateLocale)}
                </div>
                {g.error && <div className="mt-2 text-sm text-red-400">{g.error}</div>}
                {g.assets.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.assets.map((a) => {
                      if (!a.url) return null;
                      if (a.kind === "video") {
                        return (
                          <video
                            key={a.id}
                            src={a.url}
                            controls
                            className="h-24 rounded-lg border border-white/10"
                          />
                        );
                      }
                      if (a.kind === "audio") {
                        return <audio key={a.id} src={a.url} controls className="w-full" />;
                      }
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={a.id}
                          src={a.url}
                          alt="Asset"
                          className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
