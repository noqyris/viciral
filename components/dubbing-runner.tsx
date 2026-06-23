"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useAsyncGeneration } from "@/hooks/use-async-generation";
import { useLocale } from "@/components/locale-context";

const LANGUAGE_IDS = ["en", "es", "de", "fr", "it", "ar"] as const;

const T = {
  sr: {
    videoUrlLabel: "URL videa",
    videoUrlPlaceholder: "https://…/video.mp4",
    langLabel: "Jezik",
    languages: {
      en: "Engleski",
      es: "Španski",
      de: "Nemački",
      fr: "Francuski",
      it: "Italijanski",
      ar: "Arapski",
    },
    durationLabel: "Dužina videa (sek)",
    starting: "Pokrećem…",
    dubVideo: "Dubuj video",
    costNote: "premium · naplata po dužini videa",
    processing: "Video se dubuje… ovo može potrajati. Status se osvežava sam.",
    failed: "Generisanje nije uspelo.",
  },
  en: {
    videoUrlLabel: "Video URL",
    videoUrlPlaceholder: "https://…/video.mp4",
    langLabel: "Language",
    languages: {
      en: "English",
      es: "Spanish",
      de: "German",
      fr: "French",
      it: "Italian",
      ar: "Arabic",
    },
    durationLabel: "Video length (sec)",
    starting: "Starting…",
    dubVideo: "Dub video",
    costNote: "premium · billed by video length",
    processing: "The video is being dubbed… this may take a while. The status refreshes on its own.",
    failed: "Generation failed.",
  },
} as const;

export function DubbingRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [videoUrl, setVideoUrl] = useState((initialInputs?.videoUrl as string) ?? "");
  const [targetLang, setTargetLang] = useState((initialInputs?.targetLang as string) ?? "en");
  const [approxSeconds, setApproxSeconds] = useState((initialInputs?.approxSeconds as number) ?? 30);

  const { submitting, error, generation, processing, video, submit } =
    useAsyncGeneration("dubbing");

  return (
    <div className="space-y-6">
      <div className="space-y-4 surface p-5">
        <label className="block">
          <span className="field-label">{t.videoUrlLabel}</span>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={t.videoUrlPlaceholder}
            className="mt-1 field"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t.langLabel}</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="mt-1 field"
            >
              {LANGUAGE_IDS.map((id) => (
                <option key={id} value={id}>
                  {t.languages[id]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">{t.durationLabel}</span>
            <input
              type="number"
              min={5}
              max={300}
              value={approxSeconds}
              onChange={(e) => setApproxSeconds(Number(e.target.value))}
              className="mt-1 field"
            />
          </label>
        </div>

        <div className="space-y-2 pt-1">
          <Button
            onClick={() => submit({ videoUrl, targetLang, approxSeconds })}
            disabled={submitting || processing || videoUrl.length < 4}
          >
            {submitting ? t.starting : t.dubVideo}
          </Button>
          <CostHint
            credits={estimateModuleCredits("dubbing", { approxSeconds })}
            note={t.costNote}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {processing && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {t.processing}
        </div>
      )}

      {generation?.status === "FAILED" && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {generation.error ?? t.failed}
        </div>
      )}

      {video?.url && (
        <video src={video.url} controls className="w-full rounded-xl border border-white/10" />
      )}
    </div>
  );
}
