"use client";

import { useState } from "react";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerError,
  CreditsReceipt,
  AssetAction,
} from "@/components/studio/runner-kit";

const T = {
  sr: {
    procError: "Greška pri obradi",
    imageUrl: "URL slike",
    imageUrlPlaceholder: "https://…/slika.png",
    operation: "Operacija",
    format: "Format",
    processing: "Obrađujem…",
    refine: "Doteraj",
    creditsUsed: "Potrošeno kredita:",
    result: "Rezultat",
    openFullSize: "Otvori u punoj veličini →",
    outputTitle: "Obrađena slika",
    emptyLabel: "Unesi URL slike i izaberi operaciju — rezultat se pojavljuje ovde.",
    ops: {
      "bg-remove": "Ukloni pozadinu",
      upscale: "Povećaj rezoluciju",
      resize: "Promeni format",
    } as Record<string, string>,
  },
  en: {
    procError: "Processing failed",
    imageUrl: "Image URL",
    imageUrlPlaceholder: "https://…/image.png",
    operation: "Operation",
    format: "Format",
    processing: "Processing…",
    refine: "Refine",
    creditsUsed: "Credits used:",
    result: "Result",
    openFullSize: "Open full size →",
    outputTitle: "Processed image",
    emptyLabel: "Enter an image URL and pick an operation — the result appears here.",
    ops: {
      "bg-remove": "Remove background",
      upscale: "Upscale resolution",
      resize: "Change format",
    } as Record<string, string>,
  },
} as const;

interface Asset {
  kind: "image" | "video" | "text";
  url?: string | null;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

const OPERATIONS = ["bg-remove", "upscale", "resize"] as const;

const ASPECT_RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;

export function ImageToolsRunner({
  initialInputs,
}: {
  initialInputs?: Record<string, unknown>;
}) {
  const [imageUrl, setImageUrl] = useState((initialInputs?.imageUrl as string) ?? "");
  const [operation, setOperation] = useState<string>((initialInputs?.operation as string) ?? "bg-remove");
  const [aspectRatio, setAspectRatio] = useState<string>(
    (initialInputs?.aspectRatio as string) ?? "9:16",
  );
  const t = T[useLocale()];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setCreditsUsed(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "image-tools",
          mode: "manual",
          inputs: { imageUrl, operation, aspectRatio },
        }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? t.procError);
      const img = data.generation?.assets?.find((a) => a.kind === "image");
      setResultUrl(img?.url ?? null);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.imageUrl}>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t.imageUrlPlaceholder}
              className="field"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.operation}>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="field"
              >
                {OPERATIONS.map((o) => (
                  <option key={o} value={o}>
                    {t.ops[o]}
                  </option>
                ))}
              </select>
            </Field>

            {operation === "resize" && (
              <Field label={t.format}>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="field"
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <RunButton
            onClick={run}
            disabled={loading || imageUrl.length < 4}
            loading={loading}
            loadingLabel={t.processing}
            cost={<CostHint credits={estimateModuleCredits("image-tools", { operation })} />}
          >
            {t.refine}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel
          title={t.outputTitle}
          isEmpty={!resultUrl && !loading && !error}
          emptyLabel={t.emptyLabel}
        >
          {error && <RunnerError>{error}</RunnerError>}

          {resultUrl && (
            <div className="space-y-3">
              {creditsUsed != null && <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />}
              {/* Light checkerboard-ish backdrop so transparent (bg-removed) PNGs read clearly. */}
              <div
                className="overflow-hidden rounded-xl border border-white/10 bg-white/10"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt={t.result} className="w-full" />
              </div>
              <AssetAction href={resultUrl}>{t.openFullSize}</AssetAction>
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
