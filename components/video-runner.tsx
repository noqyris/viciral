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
import { useLocale } from "@/components/locale-context";
import { useVideoChain } from "@/hooks/use-video-chain";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { estimateCredits } from "@/lib/credits/pricing";

const ASPECTS = ["9:16", "16:9", "1:1"] as const;
const SEG_SECONDS = [5, 10, 15] as const;

const T = {
  sr: {
    modeText: "Iz teksta",
    modeImage: "Iz slike",
    prompt: "Opis scene / pokreta",
    promptPh: "npr. spori zoom na proizvod, topla svetlost, kinematski",
    startImage: "Polazna slika (URL)",
    startImagePh: "https://…/slika.png",
    aspect: "Format",
    segmentSec: "Trajanje klipa",
    segments: "Broj klipova",
    total: "Ukupno",
    withAudio: "Sa zvukom (Seedance native)",
    useBrand: "U stilu brenda",
    make: "Napravi video",
    starting: "Pokrećem…",
    costNote: "premium · lančani klipovi (poslednji frejm → sledeći)",
    browserNote:
      "Lančanje radi u pregledaču — drži ovaj tab otvoren dok se svi klipovi ne završe.",
    phases: {
      frame: "Pravim prvi frejm…",
      extract: "Izvlačim poslednji frejm…",
      merge: "Spajam klipove…",
    } as Record<string, string>,
    segmentBusy: (k: number, n: number) => `Generišem klip ${k}/${n}… (može potrajati)`,
    clip: (i: number) => `Klip ${i}`,
    finalTitle: "Finalni video",
    download: "Preuzmi video",
    outputTitle: "Video",
    empty: "Tvoj video će se pojaviti ovde — klip po klip, pa spojen u celinu.",
    sec: "s",
  },
  en: {
    modeText: "From text",
    modeImage: "From image",
    prompt: "Scene / motion description",
    promptPh: "e.g. slow zoom on the product, warm light, cinematic",
    startImage: "Starting image (URL)",
    startImagePh: "https://…/image.png",
    aspect: "Aspect",
    segmentSec: "Clip length",
    segments: "Number of clips",
    total: "Total",
    withAudio: "With audio (Seedance native)",
    useBrand: "In brand style",
    make: "Make video",
    starting: "Starting…",
    costNote: "premium · chained clips (last frame → next)",
    browserNote: "Chaining runs in the browser — keep this tab open until all clips finish.",
    phases: {
      frame: "Generating the first frame…",
      extract: "Extracting the last frame…",
      merge: "Merging the clips…",
    } as Record<string, string>,
    segmentBusy: (k: number, n: number) => `Generating clip ${k}/${n}… (this can take a while)`,
    clip: (i: number) => `Clip ${i}`,
    finalTitle: "Final video",
    download: "Download video",
    outputTitle: "Video",
    empty: "Your video will appear here — clip by clip, then merged into one.",
    sec: "s",
  },
} as const;

export function VideoRunner() {
  const t = T[useLocale()];
  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [startImageUrl, setStartImageUrl] = useState("");
  const [aspect, setAspect] = useState<string>("9:16");
  const [segmentSec, setSegmentSec] = useState<number>(5);
  const [segments, setSegments] = useState<number>(2);
  const [withAudio, setWithAudio] = useState(true);
  const [useBrand, setUseBrand] = useState(true);

  const { phase, segmentIndex, clips, finalUrl, error, running, run } = useVideoChain();

  const totalSec = segments * segmentSec;

  // Cost = (text → 1 first frame) + N clips + (N−1) frame extracts + (N>1 merge).
  const segCost = estimateModuleCredits("cinematic", { durationSec: segmentSec });
  const extractCost = estimateCredits("ffmpeg-extract-frame", { numImages: 1 });
  const mergeCost = segments > 1 ? estimateCredits("ffmpeg-merge", { durationSec: totalSec }) : 0;
  const frameCost = mode === "text" ? estimateCredits("nano-banana", { numImages: 1 }) : 0;
  const totalCost = frameCost + segments * segCost + Math.max(0, segments - 1) * extractCost + mergeCost;

  const canRun =
    !running && prompt.trim().length >= 2 && (mode === "text" || startImageUrl.trim().length >= 4);

  const isEmpty = phase === "idle" && clips.length === 0 && !finalUrl && !error;

  function go() {
    run({ mode, prompt, startImageUrl, aspect, segments, segmentSec, withAudio, useBrand });
  }

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {(["text", "image"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === m ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {m === "text" ? t.modeText : t.modeImage}
              </button>
            ))}
          </div>

          <Field label={t.prompt}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder={t.promptPh}
              className="field"
            />
          </Field>

          {mode === "image" && (
            <Field label={t.startImage}>
              <input
                value={startImageUrl}
                onChange={(e) => setStartImageUrl(e.target.value)}
                placeholder={t.startImagePh}
                className="field"
              />
            </Field>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Field label={t.aspect}>
              <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="field">
                {ASPECTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.segmentSec}>
              <select
                value={segmentSec}
                onChange={(e) => setSegmentSec(Number(e.target.value))}
                className="field"
              >
                {SEG_SECONDS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                    {t.sec}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.segments}>
              <input
                type="number"
                min={1}
                max={8}
                value={segments}
                onChange={(e) => setSegments(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                className="field"
              />
            </Field>
          </div>

          <p className="text-xs text-zinc-500">
            {t.total}: <span className="font-medium text-zinc-300">{totalSec}{t.sec}</span> · {segments}×{segmentSec}{t.sec}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio(e.target.checked)} />
              {t.withAudio}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={useBrand} onChange={(e) => setUseBrand(e.target.checked)} />
              {t.useBrand}
            </label>
          </div>

          <RunButton
            onClick={go}
            disabled={!canRun}
            loading={running}
            loadingLabel={t.starting}
            cost={<CostHint credits={totalCost} note={t.costNote} />}
          >
            {t.make}
          </RunButton>

          <p className="text-xs leading-relaxed text-zinc-500">{t.browserNote}</p>
        </div>
      }
      output={
        <OutputPanel
          title={t.outputTitle}
          isEmpty={isEmpty}
          emptyLabel={t.empty}
          emptyIcon={<Film className="size-5" strokeWidth={1.75} aria-hidden />}
        >
          {error && <RunnerError>{error}</RunnerError>}

          {running && (
            <RunnerNote tone="amber">
              {phase === "segment" ? t.segmentBusy(segmentIndex + 1, segments) : t.phases[phase]}
            </RunnerNote>
          )}

          {finalUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-200">{t.finalTitle}</p>
              <video src={finalUrl} controls className="w-full rounded-xl border border-white/10" />
              <AssetAction href={finalUrl} download>
                {t.download}
              </AssetAction>
            </div>
          )}

          {clips.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {clips.map((url, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-zinc-500">{t.clip(i + 1)}</p>
                  <video src={url} controls className="w-full rounded-lg border border-white/10" />
                </div>
              ))}
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
