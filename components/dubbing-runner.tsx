"use client";

import { useState } from "react";
import { CostHint } from "@/components/cost-hint";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useAsyncGeneration } from "@/hooks/use-async-generation";
import { useLocale } from "@/components/locale-context";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerLoading,
  RunnerError,
  RunnerNote,
  AssetAction,
} from "@/components/studio/runner-kit";

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
    outputTitle: "Dubovani video",
    emptyLabel: "Unesi URL videa i pokreni dubovanje — rezultat će se pojaviti ovde.",
    loadingLabel: "Dubujem video…",
    downloadVideo: "Preuzmi video",
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
    outputTitle: "Dubbed video",
    emptyLabel: "Enter a video URL and start dubbing — the result will appear here.",
    loadingLabel: "Dubbing the video…",
    downloadVideo: "Download video",
  },
} as const;

export function DubbingRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [videoUrl, setVideoUrl] = useState((initialInputs?.videoUrl as string) ?? "");
  const [targetLang, setTargetLang] = useState((initialInputs?.targetLang as string) ?? "en");
  const [approxSeconds, setApproxSeconds] = useState((initialInputs?.approxSeconds as number) ?? 30);

  const { submitting, error, generation, processing, video, submit } =
    useAsyncGeneration("dubbing");

  const hasResult = Boolean(video?.url);
  const isEmpty = !hasResult && !processing && !error && generation?.status !== "FAILED";

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.videoUrlLabel}>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={t.videoUrlPlaceholder}
              className="field"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.langLabel}>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="field"
              >
                {LANGUAGE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {t.languages[id]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t.durationLabel}>
              <input
                type="number"
                min={5}
                max={300}
                value={approxSeconds}
                onChange={(e) => setApproxSeconds(Number(e.target.value))}
                className="field"
              />
            </Field>
          </div>

          <RunButton
            onClick={() => submit({ videoUrl, targetLang, approxSeconds })}
            disabled={submitting || processing || videoUrl.length < 4}
            loading={submitting}
            loadingLabel={t.starting}
            cost={
              <CostHint
                credits={estimateModuleCredits("dubbing", { approxSeconds })}
                note={t.costNote}
              />
            }
          >
            {t.dubVideo}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel title={t.outputTitle} isEmpty={isEmpty} emptyLabel={t.emptyLabel}>
          {error && <RunnerError>{error}</RunnerError>}

          {processing && <RunnerNote tone="amber">{t.processing}</RunnerNote>}

          {generation?.status === "FAILED" && (
            <RunnerError>{generation.error ?? t.failed}</RunnerError>
          )}

          {processing && !error && <RunnerLoading label={t.loadingLabel} />}

          {video?.url && (
            <div className="space-y-3">
              <video
                src={video.url}
                controls
                className="w-full rounded-xl border border-white/10"
              />
              <AssetAction href={video.url} download>
                {t.downloadVideo}
              </AssetAction>
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
