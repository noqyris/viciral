import Link from "next/link";
import { PLATFORMS } from "@/lib/publishing/types";
import { getLocale } from "@/lib/i18n-server";

const T = {
  sr: {
    title: "Povezivanje naloga",
    sub: "Poveži društvene naloge da bi Viciral mogao automatski da objavljuje zakazane objave.",
    noteBefore:
      "Povezivanje stiže uskoro — čeka registraciju OAuth aplikacija (Meta / TikTok / LinkedIn) i ključeve. Do tada možeš da zakazuješ objave u ",
    noteLink: "Kalendaru",
    noteAfter: "; izaći će čim povezivanje bude aktivno.",
    connectSoon: "Poveži (uskoro)",
  },
  en: {
    title: "Connect accounts",
    sub: "Connect your social accounts so Viciral can automatically publish scheduled posts.",
    noteBefore:
      "Connections are coming soon — waiting on OAuth app registration (Meta / TikTok / LinkedIn) and keys. Until then you can schedule posts in the ",
    noteLink: "Calendar",
    noteAfter: "; they'll go out as soon as connections are live.",
    connectSoon: "Connect (soon)",
  },
} as const;

export default async function ConnectionsPage() {
  const locale = await getLocale();
  const t = T[locale];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-100">{t.title}</h1>
      <p className="mb-8 text-zinc-400">{t.sub}</p>

      <div className="mb-8 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
        {t.noteBefore}
        <Link href="/studio/calendar" className="font-medium underline">
          {t.noteLink}
        </Link>
        {t.noteAfter}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between surface p-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.icon}</span>
              <div className="font-medium text-zinc-100">{p.label}</div>
            </div>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-zinc-400"
            >
              {t.connectSoon}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
