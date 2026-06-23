"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useAsyncGeneration } from "@/hooks/use-async-generation";
import { useLocale } from "@/components/locale-context";

// Inline (not imported from the module) to keep server-only code out of the client bundle.
const VOICE_IDS = ["f1", "f2", "m1", "m2"] as const;

const T = {
  sr: {
    portraitLabel: "Portret / avatar (URL)",
    portraitPlaceholder: "https://…/portret.png",
    scriptLabel: "Skripta (šta govori)",
    scriptPlaceholder: "npr. Zdravo! Danas vam predstavljam našu novu kolekciju…",
    voiceLabel: "Glas",
    voices: {
      f1: "Ženski — topao",
      f2: "Ženski — energičan",
      m1: "Muški — smiren",
      m2: "Muški — dubok",
    },
    starting: "Pokrećem…",
    makeAvatar: "Napravi avatar video",
    costNote: "premium · dužina prati skriptu",
    processing: "Avatar video se generiše… ovo može potrajati minut-dva. Status se osvežava sam.",
    failed: "Generisanje nije uspelo.",
  },
  en: {
    portraitLabel: "Portrait / avatar (URL)",
    portraitPlaceholder: "https://…/portrait.png",
    scriptLabel: "Script (what they say)",
    scriptPlaceholder: "e.g. Hi! Today I'm introducing our new collection…",
    voiceLabel: "Voice",
    voices: {
      f1: "Female — warm",
      f2: "Female — energetic",
      m1: "Male — calm",
      m2: "Male — deep",
    },
    starting: "Starting…",
    makeAvatar: "Make avatar video",
    costNote: "premium · length follows the script",
    processing: "The avatar video is being generated… this can take a minute or two. The status refreshes on its own.",
    failed: "Generation failed.",
  },
} as const;

export function AvatarRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [imageUrl, setImageUrl] = useState((initialInputs?.imageUrl as string) ?? "");
  const [script, setScript] = useState((initialInputs?.script as string) ?? "");
  const [voiceId, setVoiceId] = useState((initialInputs?.voiceId as string) ?? "f1");

  const { submitting, error, generation, processing, video, submit } =
    useAsyncGeneration("avatar");

  return (
    <div className="space-y-6">
      <div className="space-y-4 surface p-5">
        <label className="block">
          <span className="field-label">{t.portraitLabel}</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t.portraitPlaceholder}
            className="mt-1 field"
          />
        </label>

        <label className="block">
          <span className="field-label">{t.scriptLabel}</span>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={4}
            placeholder={t.scriptPlaceholder}
            className="mt-1 field"
          />
        </label>

        <label className="block sm:max-w-[16rem]">
          <span className="field-label">{t.voiceLabel}</span>
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="mt-1 field"
          >
            {VOICE_IDS.map((id) => (
              <option key={id} value={id}>
                {t.voices[id]}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 pt-1">
          <Button
            onClick={() => submit({ imageUrl, script, voiceId })}
            disabled={submitting || processing || imageUrl.length < 4 || script.length < 2}
          >
            {submitting ? t.starting : t.makeAvatar}
          </Button>
          <CostHint
            credits={estimateModuleCredits("avatar", { script })}
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
