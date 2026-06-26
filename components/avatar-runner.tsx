"use client";

import { useState } from "react";
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
    outputTitle: "Avatar video",
    emptyLabel: "Tvoj avatar video će se pojaviti ovde nakon generisanja.",
    downloadVideo: "Preuzmi video",
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
    outputTitle: "Avatar video",
    emptyLabel: "Your avatar video will appear here once it's generated.",
    downloadVideo: "Download video",
  },
} as const;

export function AvatarRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [imageUrl, setImageUrl] = useState((initialInputs?.imageUrl as string) ?? "");
  const [script, setScript] = useState((initialInputs?.script as string) ?? "");
  const [voiceId, setVoiceId] = useState((initialInputs?.voiceId as string) ?? "f1");

  const { submitting, error, generation, processing, video, submit } =
    useAsyncGeneration("avatar");

  const failed = generation?.status === "FAILED";
  const isEmpty = !video?.url && !processing && !error && !failed;

  return (
    <RunnerLayout
      controls={
        <>
          <Field label={t.portraitLabel}>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t.portraitPlaceholder}
              className="field"
            />
          </Field>

          <Field label={t.scriptLabel} className="mt-4">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
              placeholder={t.scriptPlaceholder}
              className="field"
            />
          </Field>

          <Field label={t.voiceLabel} className="mt-4 sm:max-w-[16rem]">
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="field"
            >
              {VOICE_IDS.map((id) => (
                <option key={id} value={id}>
                  {t.voices[id]}
                </option>
              ))}
            </select>
          </Field>

          <RunButton
            onClick={() => submit({ imageUrl, script, voiceId })}
            disabled={submitting || processing || imageUrl.length < 4 || script.length < 2}
            loading={submitting}
            loadingLabel={t.starting}
            cost={
              <CostHint
                credits={estimateModuleCredits("avatar", { script })}
                note={t.costNote}
              />
            }
          >
            {t.makeAvatar}
          </RunButton>
        </>
      }
      output={
        <OutputPanel title={t.outputTitle} isEmpty={isEmpty} emptyLabel={t.emptyLabel}>
          {error && <RunnerError>{error}</RunnerError>}

          {processing && <RunnerNote tone="amber">{t.processing}</RunnerNote>}

          {failed && <RunnerError>{generation?.error ?? t.failed}</RunnerError>}

          {video?.url && (
            <div className="space-y-3">
              <video src={video.url} controls className="w-full rounded-xl border border-white/10" />
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
