"use client";

import { useState } from "react";
import { CostHint } from "@/components/cost-hint";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useLocale } from "@/components/locale-context";
import { useGeneration } from "@/hooks/use-generation";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerLoading,
  RunnerError,
  CreditsReceipt,
  AssetAction,
} from "@/components/studio/runner-kit";

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
    costNote: "30s · Lyria 2",
    creditsUsed: "Potrošeno kredita:",
    download: "Preuzmi / otvori →",
    outputTitle: "Numera",
    emptyLabel: "Opišite muziku koju želite i ona će se pojaviti ovde.",
    composingLabel: "Komponujem vašu numeru…",
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
    costNote: "30s · Lyria 2",
    creditsUsed: "Credits used:",
    download: "Download / open →",
    outputTitle: "Track",
    emptyLabel: "Describe the music you want and it will appear here.",
    composingLabel: "Composing your track…",
  },
} as const;

export function MusicRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [prompt, setPrompt] = useState((initialInputs?.prompt as string) ?? "");

  const { loading, error, assets, creditsUsed, run } = useGeneration("music", {
    errorLabel: t.generationError,
  });
  const audioUrl = assets.find((a) => a.kind === "audio")?.url ?? null;

  const submit = () => run({ prompt });

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.musicDescLabel}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder={t.musicDescPlaceholder}
              className="field"
            />
          </Field>

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

          <RunButton
            onClick={submit}
            disabled={loading || prompt.length < 2}
            loading={loading}
            loadingLabel={t.composing}
            cost={<CostHint credits={estimateModuleCredits("music")} note={t.costNote} />}
          >
            {t.makeMusic}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel
          title={t.outputTitle}
          isEmpty={!loading && !error && !audioUrl}
          emptyLabel={t.emptyLabel}
        >
          {error ? <RunnerError>{error}</RunnerError> : null}

          {loading ? <RunnerLoading label={t.composingLabel} /> : null}

          {audioUrl ? (
            <div className="space-y-3">
              {creditsUsed != null ? (
                <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />
              ) : null}
              <audio src={audioUrl} controls className="w-full" />
              <AssetAction href={audioUrl} download>
                {t.download}
              </AssetAction>
            </div>
          ) : null}
        </OutputPanel>
      }
    />
  );
}
