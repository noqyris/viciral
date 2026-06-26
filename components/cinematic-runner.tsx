"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { CostHint } from "@/components/cost-hint";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerError,
  RunnerNote,
  AssetAction,
} from "@/components/studio/runner-kit";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useAsyncGeneration } from "@/hooks/use-async-generation";
import { useLocale } from "@/components/locale-context";

const T = {
  sr: {
    startImageLabel: "Polazna slika (URL)",
    startImagePlaceholder: "https://…/slika.png",
    motionLabel: "Opis pokreta / scene",
    motionPlaceholder: "npr. spori zoom na proizvod, topla svetlost, kinematski",
    durationLabel: "Trajanje",
    duration5: "5 sekundi",
    duration10: "10 sekundi",
    withAudio: "Sa zvukom (muzika / SFX, bez doplate)",
    starting: "Pokrećem…",
    makeVideo: "Napravi video",
    costNote: "premium · video se naplaćuje po trajanju",
    processing: "Video se generiše… ovo može potrajati minut-dva. Status se osvežava sam.",
    failed: "Generisanje nije uspelo.",
    outputTitle: "Video",
    emptyLabel: "Tvoj kinematski video će se pojaviti ovde nakon generisanja.",
    downloadVideo: "Preuzmi video",
  },
  en: {
    startImageLabel: "Starting image (URL)",
    startImagePlaceholder: "https://…/image.png",
    motionLabel: "Motion / scene description",
    motionPlaceholder: "e.g. slow zoom on the product, warm light, cinematic",
    durationLabel: "Duration",
    duration5: "5 seconds",
    duration10: "10 seconds",
    withAudio: "With audio (music / SFX, no extra charge)",
    starting: "Starting…",
    makeVideo: "Make video",
    costNote: "premium · video is billed by duration",
    processing: "The video is being generated… this can take a minute or two. The status refreshes on its own.",
    failed: "Generation failed.",
    outputTitle: "Video",
    emptyLabel: "Your cinematic video will appear here after it's generated.",
    downloadVideo: "Download video",
  },
} as const;

export function CinematicRunner() {
  const t = T[useLocale()];
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [durationSec, setDurationSec] = useState<5 | 10>(5);
  const [withAudio, setWithAudio] = useState(true);

  const { submitting, error, generation, processing, video, submit } =
    useAsyncGeneration("cinematic");

  const failed = generation?.status === "FAILED";
  const isEmpty = !video?.url && !error && !processing && !failed;

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.startImageLabel}>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t.startImagePlaceholder}
              className="field"
            />
          </Field>

          <Field label={t.motionLabel}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder={t.motionPlaceholder}
              className="field"
            />
          </Field>

          <Field label={t.durationLabel}>
            <select
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value) === 10 ? 10 : 5)}
              className="field"
            >
              <option value={5}>{t.duration5}</option>
              <option value={10}>{t.duration10}</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={withAudio}
              onChange={(e) => setWithAudio(e.target.checked)}
            />
            {t.withAudio}
          </label>

          <RunButton
            onClick={() => submit({ prompt, imageUrl, durationSec, withAudio })}
            disabled={submitting || processing || prompt.length < 2 || imageUrl.length < 4}
            loading={submitting}
            loadingLabel={t.starting}
            cost={
              <CostHint
                credits={estimateModuleCredits("cinematic", { durationSec })}
                note={t.costNote}
              />
            }
          >
            {t.makeVideo}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel
          title={t.outputTitle}
          isEmpty={isEmpty}
          emptyLabel={t.emptyLabel}
          emptyIcon={<Film className="size-5" strokeWidth={1.75} aria-hidden />}
        >
          {error && <RunnerError>{error}</RunnerError>}

          {processing && <RunnerNote tone="amber">{t.processing}</RunnerNote>}

          {failed && <RunnerError>{generation?.error ?? t.failed}</RunnerError>}

          {video?.url && (
            <>
              <video
                src={video.url}
                controls
                className="w-full rounded-xl border border-white/10"
              />
              <AssetAction href={video.url} download>
                {t.downloadVideo}
              </AssetAction>
            </>
          )}
        </OutputPanel>
      }
    />
  );
}
