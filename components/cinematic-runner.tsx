"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
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

  return (
    <div className="space-y-6">
      <div className="space-y-4 surface p-5">
        <label className="block">
          <span className="field-label">{t.startImageLabel}</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t.startImagePlaceholder}
            className="mt-1 field"
          />
        </label>

        <label className="block">
          <span className="field-label">{t.motionLabel}</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder={t.motionPlaceholder}
            className="mt-1 field"
          />
        </label>

        <label className="block">
          <span className="field-label">{t.durationLabel}</span>
          <select
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value) === 10 ? 10 : 5)}
            className="mt-1 field"
          >
            <option value={5}>{t.duration5}</option>
            <option value={10}>{t.duration10}</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={withAudio}
            onChange={(e) => setWithAudio(e.target.checked)}
          />
          {t.withAudio}
        </label>

        <div className="space-y-2">
          <Button
            onClick={() => submit({ prompt, imageUrl, durationSec, withAudio })}
            disabled={submitting || processing || prompt.length < 2 || imageUrl.length < 4}
          >
            {submitting ? t.starting : t.makeVideo}
          </Button>
          <CostHint
            credits={estimateModuleCredits("cinematic", { durationSec })}
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
        <video
          src={video.url}
          controls
          className="w-full rounded-xl border border-white/10"
        />
      )}
    </div>
  );
}
