"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useLocale } from "@/components/locale-context";

const T = {
  sr: {
    generationError: "Greška pri generisanju",
    musicDescLabel: "Opis muzike",
    musicDescPlaceholder: "npr. vesela akustična gitara, optimistično, za reklamu",
    presets: [
      "Vesela akustična gitara, optimistično, za reklamu",
      "Mirna ambijentalna podloga, lo-fi, za vlog",
      "Energičan elektronski bit, za TikTok najavu",
    ],
    durationLabel: "Trajanje (sek)",
    composing: "Komponujem…",
    makeMusic: "Napravi muziku",
    costNote: "po sekundi",
    creditsUsed: "Potrošeno kredita:",
    download: "Preuzmi / otvori →",
  },
  en: {
    generationError: "Generation error",
    musicDescLabel: "Music description",
    musicDescPlaceholder: "e.g. cheerful acoustic guitar, upbeat, for an ad",
    presets: [
      "Cheerful acoustic guitar, upbeat, for an ad",
      "Calm ambient backing, lo-fi, for a vlog",
      "Energetic electronic beat, for a TikTok intro",
    ],
    durationLabel: "Duration (sec)",
    composing: "Composing…",
    makeMusic: "Make music",
    costNote: "per second",
    creditsUsed: "Credits used:",
    download: "Download / open →",
  },
} as const;

interface Asset {
  kind: "image" | "video" | "text" | "audio";
  url?: string | null;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function MusicRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [prompt, setPrompt] = useState((initialInputs?.prompt as string) ?? "");
  const [durationSec, setDurationSec] = useState((initialInputs?.durationSec as number) ?? 20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setCreditsUsed(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "music",
          mode: "manual",
          inputs: { prompt, durationSec },
        }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? t.generationError);
      const audio = data.generation?.assets?.find((a) => a.kind === "audio");
      setAudioUrl(audio?.url ?? null);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 surface p-5">
        <label className="block">
          <span className="field-label">{t.musicDescLabel}</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder={t.musicDescPlaceholder}
            className="mt-1 field"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {t.presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-violet-300 hover:text-violet-300"
            >
              {p}
            </button>
          ))}
        </div>

        <label className="block sm:max-w-[12rem]">
          <span className="field-label">{t.durationLabel}</span>
          <input
            type="number"
            min={5}
            max={120}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            className="mt-1 field"
          />
        </label>

        <div className="space-y-2 pt-1">
          <Button onClick={run} disabled={loading || prompt.length < 2}>
            {loading ? t.composing : t.makeMusic}
          </Button>
          <CostHint credits={estimateModuleCredits("music", { durationSec })} note={t.costNote} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="space-y-2 surface p-4">
          {creditsUsed != null && (
            <div className="text-sm text-zinc-400">{t.creditsUsed} {creditsUsed}</div>
          )}
          <audio src={audioUrl} controls className="w-full" />
          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-violet-300 hover:underline"
          >
            {t.download}
          </a>
        </div>
      )}
    </div>
  );
}
