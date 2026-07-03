"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/icons";
import { useLocale } from "@/components/locale-context";
import type { Locale } from "@/lib/i18n";
import { PLATFORMS } from "@/lib/publishing/types";

export interface ScheduledView {
  id: string;
  platform: string;
  caption: string;
  scheduledAt: string; // ISO
  status: string;
  mediaUrl: string | null;
  error: string | null;
}

const T = {
  sr: {
    connectNotePrefix: "Zakazane objave čekaju da povežeš nalog (",
    connectNoteLink: "Povezivanje",
    connectNoteSuffix:
      ") — kada OAuth bude podešen, izlaze automatski preko cron-a.",
    schedulePost: "Zakaži objavu",
    platform: "Platforma",
    dateTime: "Datum i vreme",
    postText: "Tekst objave",
    postTextPlaceholder: "Tekst objave + hashtagovi…",
    mediaUrl: "URL slike/videa (opciono)",
    scheduling: "Zakazujem…",
    schedule: "Zakaži",
    cancel: "Otkaži",
    empty: "Još nema zakazanih objava.",
    pickDateTime: "Izaberi datum i vreme.",
    genericError: "Greška",
    statusScheduled: "Zakazano",
    statusPublishing: "Objavljuje se",
    statusPublished: "Objavljeno",
    statusFailed: "Greška",
    statusCanceled: "Otkazano",
    locale: "sr-RS",
  },
  en: {
    connectNotePrefix: "Scheduled posts are waiting for you to connect an account (",
    connectNoteLink: "Connections",
    connectNoteSuffix:
      ") — once OAuth is set up, they go out automatically via cron.",
    schedulePost: "Schedule a post",
    platform: "Platform",
    dateTime: "Date and time",
    postText: "Post text",
    postTextPlaceholder: "Post text + hashtags…",
    mediaUrl: "Image/video URL (optional)",
    scheduling: "Scheduling…",
    schedule: "Schedule",
    cancel: "Cancel",
    empty: "No scheduled posts yet.",
    pickDateTime: "Pick a date and time.",
    genericError: "Error",
    statusScheduled: "Scheduled",
    statusPublishing: "Publishing",
    statusPublished: "Published",
    statusFailed: "Failed",
    statusCanceled: "Canceled",
    locale: "en-US",
  },
} as const;

const STATUS_CLS: Record<string, string> = {
  SCHEDULED: "bg-white/10 text-zinc-400",
  PUBLISHING: "bg-amber-500/15 text-amber-300",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300",
  FAILED: "bg-red-500/15 text-red-300",
  CANCELED: "bg-white/10 text-zinc-400",
};

function statusLabel(status: string, t: (typeof T)[Locale]): string {
  switch (status) {
    case "PUBLISHING":
      return t.statusPublishing;
    case "PUBLISHED":
      return t.statusPublished;
    case "FAILED":
      return t.statusFailed;
    case "CANCELED":
      return t.statusCanceled;
    default:
      return t.statusScheduled;
  }
}

export function CalendarManager({
  initial,
  seed,
}: {
  initial: ScheduledView[];
  seed?: { caption?: string; mediaUrl?: string; platform?: string };
}) {
  const t = T[useLocale()];
  const [posts, setPosts] = useState<ScheduledView[]>(initial);
  const [platform, setPlatform] = useState<string>(seed?.platform ?? PLATFORMS[0]?.id ?? "instagram");
  const [caption, setCaption] = useState(seed?.caption ?? "");
  const [mediaUrl, setMediaUrl] = useState(seed?.mediaUrl ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/schedule");
    if (!res.ok) return; // don't blank the list on a transient GET failure
    const data = (await res.json()) as { posts?: ScheduledView[] };
    setPosts(data.posts ?? []);
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      if (!scheduledAt) throw new Error(t.pickDateTime);
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform,
          caption,
          mediaUrl: mediaUrl || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t.genericError);
      setCaption("");
      setMediaUrl("");
      setScheduledAt("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? t.genericError);
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
        {t.connectNotePrefix}
        <Link href="/studio/connections" className="font-medium underline">
          {t.connectNoteLink}
        </Link>
        {t.connectNoteSuffix}
      </div>

      <div className="space-y-4 surface p-5">
        <h2 className="font-semibold text-zinc-100">{t.schedulePost}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t.platform}</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 field"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">{t.dateTime}</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 field"
            />
          </label>
        </div>
        <label className="block">
          <span className="field-label">{t.postText}</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder={t.postTextPlaceholder}
            className="mt-1 field"
          />
        </label>
        <label className="block">
          <span className="field-label">{t.mediaUrl}</span>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://…/asset.png"
            className="mt-1 field"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={create} disabled={busy || caption.trim().length === 0 || !scheduledAt}>
          {busy ? t.scheduling : t.schedule}
        </Button>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-400">{t.empty}</p>
        ) : (
          posts.map((p) => {
            const cls = STATUS_CLS[p.status] ?? STATUS_CLS.SCHEDULED;
            return (
              <div key={p.id} className="surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-zinc-100">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-zinc-300 ring-1 ring-white/10">
                      <PlatformIcon id={p.platform} className="h-3.5 w-3.5" />
                    </span>
                    {new Date(p.scheduledAt).toLocaleString(t.locale)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
                      {statusLabel(p.status, t)}
                    </span>
                    {p.status === "SCHEDULED" && (
                      <Button variant="ghost" onClick={() => cancel(p.id)}>
                        {t.cancel}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-400">{p.caption}</p>
                {p.error && <p className="mt-1 text-sm text-red-400">{p.error}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
