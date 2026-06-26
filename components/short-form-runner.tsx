"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { useLocale } from "@/components/locale-context";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerError,
  CreditsReceipt,
} from "@/components/studio/runner-kit";

const T = {
  sr: {
    processingError: "Greška pri obradi",
    mediaUrlLabel: "URL videa / audija",
    mediaUrlPlaceholder: "https://…/podkast.mp4",
    platformLabel: "Platforma",
    clipCountLabel: "Broj klipova",
    sourceLengthLabel: "Dužina izvora (min)",
    processing: "Obrađujem…",
    findClips: "Nađi klipove",
    autoTitle: "Jača orkestracija (Opus) za bolji izbor momenata",
    costNote: "transkripcija + AI izbor momenata · render klipova uskoro",
    creditsUsed: "Potrošeno kredita:",
    outputTitle: "Klipovi",
    emptyLabel: "Unesite link i nađite najbolje momente za kratke klipove.",
  },
  en: {
    processingError: "Processing error",
    mediaUrlLabel: "Video / audio URL",
    mediaUrlPlaceholder: "https://…/podcast.mp4",
    platformLabel: "Platform",
    clipCountLabel: "Number of clips",
    sourceLengthLabel: "Source length (min)",
    processing: "Processing…",
    findClips: "Find clips",
    autoTitle: "Stronger orchestration (Opus) for a better choice of moments",
    costNote: "transcription + AI moment selection · clip rendering coming soon",
    creditsUsed: "Credits used:",
    outputTitle: "Clips",
    emptyLabel: "Paste a link and find the best moments for short clips.",
  },
} as const;

interface Asset {
  kind: "image" | "video" | "text";
  text?: string | null;
  meta?: { role?: string; viralityScore?: number } | null;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function ShortFormRunner({
  supportsAuto,
  initialInputs,
}: {
  supportsAuto: boolean;
  initialInputs?: Record<string, unknown>;
}) {
  const t = T[useLocale()];
  const [mediaUrl, setMediaUrl] = useState((initialInputs?.mediaUrl as string) ?? "");
  const [approxMinutes, setApproxMinutes] = useState((initialInputs?.approxMinutes as number) ?? 10);
  const [platform, setPlatform] = useState((initialInputs?.platform as string) ?? "tiktok");
  const [clipCount, setClipCount] = useState((initialInputs?.clipCount as number) ?? 5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Asset[] | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  async function run(mode: "manual" | "auto") {
    setLoading(true);
    setError(null);
    setClips(null);
    setCreditsUsed(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "short-form",
          mode,
          inputs: { mediaUrl, approxMinutes, platform, clipCount },
        }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? t.processingError);
      setClips((data.generation?.assets ?? []).filter((a) => a.kind === "text"));
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = creditsUsed != null || (clips != null && clips.length > 0);

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.mediaUrlLabel}>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={t.mediaUrlPlaceholder}
              className="field"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t.platformLabel}>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="field"
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            </Field>

            <Field label={t.clipCountLabel}>
              <input
                type="number"
                min={1}
                max={10}
                value={clipCount}
                onChange={(e) => setClipCount(Number(e.target.value))}
                className="field"
              />
            </Field>

            <Field label={t.sourceLengthLabel}>
              <input
                type="number"
                min={1}
                max={60}
                value={approxMinutes}
                onChange={(e) => setApproxMinutes(Number(e.target.value))}
                className="field"
              />
            </Field>
          </div>

          <RunButton
            onClick={() => run("manual")}
            disabled={loading || mediaUrl.length < 4}
            loading={loading}
            loadingLabel={t.processing}
            cost={
              <CostHint
                credits={estimateModuleCredits("short-form", { approxMinutes })}
                note={t.costNote}
              />
            }
          >
            {t.findClips}
          </RunButton>

          {supportsAuto && (
            <Button
              variant="secondary"
              onClick={() => run("auto")}
              disabled={loading || mediaUrl.length < 4}
              title={t.autoTitle}
              className="w-full gap-2"
            >
              <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              Auto
            </Button>
          )}
        </div>
      }
      output={
        <OutputPanel
          title={t.outputTitle}
          isEmpty={!loading && !error && !hasResult}
          emptyLabel={t.emptyLabel}
        >
          {error && <RunnerError>{error}</RunnerError>}

          {creditsUsed != null && <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />}

          {clips && clips.length > 0 && (
            <div className="space-y-3">
              {clips.map((c, i) => (
                <div
                  key={i}
                  className="whitespace-pre-wrap surface p-4 text-sm text-zinc-200"
                >
                  {c.text}
                </div>
              ))}
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
