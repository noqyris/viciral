"use client";

import { useState } from "react";
import { Mic2 } from "lucide-react";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerLoading,
  RunnerError,
  CreditsReceipt,
  AssetAction,
  AdvancedSection,
} from "@/components/studio/runner-kit";

const VOICES = [
  "Rachel", "Aria", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River",
  "Liam", "Charlotte", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian",
  "Daniel", "Lily", "Bill",
] as const;

const T = {
  sr: {
    err: "Greška pri generisanju",
    text: "Tekst / scenario",
    textPh: "Unesi tekst koji glas treba da izgovori…",
    voice: "Glas",
    advanced: "Napredno",
    stability: "Stabilnost",
    similarity: "Sličnost glasu",
    style: "Stil (izraženost)",
    speed: "Brzina",
    language: "Jezik (ISO, opciono)",
    languagePh: "npr. sr, en",
    generating: "Generišem…",
    make: "Napravi glas",
    costNote: "po 1000 karaktera",
    creditsUsed: "Potrošeno kredita:",
    download: "Preuzmi audio",
    output: "Glas",
    empty: "Unesi tekst i izaberi glas — naracija će se pojaviti ovde.",
    loading: "Generišem naraciju…",
  },
  en: {
    err: "Generation failed",
    text: "Text / script",
    textPh: "Enter the text the voice should speak…",
    voice: "Voice",
    advanced: "Advanced",
    stability: "Stability",
    similarity: "Voice similarity",
    style: "Style (exaggeration)",
    speed: "Speed",
    language: "Language (ISO, optional)",
    languagePh: "e.g. sr, en",
    generating: "Generating…",
    make: "Make voiceover",
    costNote: "per 1000 characters",
    creditsUsed: "Credits used:",
    download: "Download audio",
    output: "Voice",
    empty: "Enter text and pick a voice — the narration will appear here.",
    loading: "Generating the narration…",
  },
} as const;

interface Asset {
  kind: "image" | "video" | "text" | "audio";
  url?: string | null;
}
interface GenResp {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function VoiceRunner() {
  const t = T[useLocale()];
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Rachel");
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [language, setLanguage] = useState("");

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
          moduleSlug: "voice",
          mode: "manual",
          inputs: { text, voice, stability, similarityBoost, style, speed, language },
        }),
      });
      const data = (await res.json()) as GenResp;
      if (!res.ok) throw new Error(data.error ?? t.err);
      const audio = data.generation?.assets?.find((a) => a.kind === "audio");
      setAudioUrl(audio?.url ?? null);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      notifyCreditsChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, step: number) => (
    <Field label={`${label}: ${value}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-violet-500"
      />
    </Field>
  );

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.text}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder={t.textPh}
              className="field"
            />
          </Field>

          <Field label={t.voice}>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="field">
              {VOICES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <AdvancedSection title={t.advanced}>
            {slider(t.stability, stability, setStability, 0, 1, 0.05)}
            {slider(t.similarity, similarityBoost, setSimilarityBoost, 0, 1, 0.05)}
            {slider(t.style, style, setStyle, 0, 1, 0.05)}
            {slider(t.speed, speed, setSpeed, 0.7, 1.2, 0.05)}
            <Field label={t.language}>
              <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder={t.languagePh} className="field" />
            </Field>
          </AdvancedSection>

          <RunButton
            onClick={run}
            disabled={loading || text.trim().length < 1}
            loading={loading}
            loadingLabel={t.generating}
            cost={<CostHint credits={estimateModuleCredits("voice", { text })} note={t.costNote} />}
          >
            {t.make}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel
          title={t.output}
          isEmpty={!loading && !error && !audioUrl}
          emptyLabel={t.empty}
          emptyIcon={<Mic2 className="size-6" strokeWidth={1.75} aria-hidden />}
        >
          {error && <RunnerError>{error}</RunnerError>}
          {loading && <RunnerLoading label={t.loading} />}
          {audioUrl && (
            <div className="space-y-3">
              {creditsUsed != null && <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />}
              <audio src={audioUrl} controls className="w-full" />
              <AssetAction href={audioUrl} download>
                {t.download}
              </AssetAction>
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
