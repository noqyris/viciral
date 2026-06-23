"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";

const T = {
  sr: {
    invalidUrl: "Unesi ispravan URL slike (http/https).",
    schemeError: "URL mora počinjati sa http:// ili https://.",
    editError: "Greška pri izmeni",
    noImageReturned: "Izmena nije vratila sliku",
    sourceUrl: "URL slike za izmenu",
    sourceUrlPlaceholder: "https://…/slika.png",
    load: "Učitaj",
    currentImage: "Trenutna slika",
    totalSpent: (n: number) => `Potrošeno ukupno: ${n} kredita`,
    openFullSize: "Otvori u punoj veličini →",
    describeEdit: "Opiši izmenu",
    editPlaceholder: "npr. zameni pozadinu plažom u zalazak sunca",
    format: "Format",
    original: "Originalni",
    applying: "Primenjujem…",
    applyEdit: "Primeni izmenu",
    startOver: "Počni ispočetka",
    costNote: "po izmeni · izmene se nadovezuju",
    editHistory: "Istorija izmena",
    revertHint: "Klikni na korak da se vratiš na njega.",
    originalStep: "original",
    presets: [
      "Zameni pozadinu čistom studijskom belom",
      "Ukloni objekat u prvom planu",
      "Pretvori u topli, sunčan ambijent",
      "Dodaj minimalističku senku ispod proizvoda",
    ],
  },
  en: {
    invalidUrl: "Enter a valid image URL (http/https).",
    schemeError: "URL must start with http:// or https://.",
    editError: "Editing failed",
    noImageReturned: "The edit returned no image",
    sourceUrl: "Image URL to edit",
    sourceUrlPlaceholder: "https://…/image.png",
    load: "Load",
    currentImage: "Current image",
    totalSpent: (n: number) => `Total spent: ${n} credits`,
    openFullSize: "Open full size →",
    describeEdit: "Describe the edit",
    editPlaceholder: "e.g. replace the background with a beach at sunset",
    format: "Format",
    original: "Original",
    applying: "Applying…",
    applyEdit: "Apply edit",
    startOver: "Start over",
    costNote: "per edit · edits stack on top of each other",
    editHistory: "Edit history",
    revertHint: "Click a step to revert to it.",
    originalStep: "original",
    presets: [
      "Replace the background with clean studio white",
      "Remove the object in the foreground",
      "Turn into a warm, sunny setting",
      "Add a minimalist shadow under the product",
    ],
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

interface Step {
  url: string;
  instruction: string;
}

const ASPECT_RATIOS = ["original", "1:1", "4:5", "9:16", "16:9"] as const;

const checkerStyle = {
  backgroundImage:
    "linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
};

export function EditorRunner() {
  const t = T[useLocale()];
  const [sourceUrl, setSourceUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("original");

  const [history, setHistory] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCredits, setTotalCredits] = useState(0);

  const current = history.length ? history[history.length - 1] : null;

  function loadSource() {
    const u = sourceUrl.trim();
    // Validate the scheme client-side (mirrors the server z.string().url()) so
    // step 0's URL — the one value that is raw user input — can never put an
    // unexpected scheme into the preview/href.
    let parsed: URL;
    try {
      parsed = new URL(u);
    } catch {
      setError(t.invalidUrl);
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError(t.schemeError);
      return;
    }
    setError(null);
    setHistory([{ url: u, instruction: t.originalStep }]);
    setTotalCredits(0);
  }

  function reset() {
    setHistory([]);
    setInstruction("");
    setError(null);
    setTotalCredits(0);
  }

  function revertTo(index: number) {
    setHistory((h) => h.slice(0, index + 1));
    setError(null);
  }

  async function applyEdit() {
    if (!current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "editor",
          mode: "manual",
          inputs: { imageUrl: current.url, instruction, aspectRatio },
        }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? t.editError);
      const img = data.generation?.assets?.find((a) => a.kind === "image");
      if (!img?.url) throw new Error(t.noImageReturned);
      setHistory((h) => [...h, { url: img.url!, instruction }]);
      setTotalCredits((c) => c + (data.generation?.creditsUsed ?? 0));
      setInstruction("");
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Source loader */}
      <div className="space-y-3 surface p-5">
        <label className="block">
          <span className="field-label">{t.sourceUrl}</span>
          <div className="mt-1 flex gap-2">
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={t.sourceUrlPlaceholder}
              className="field"
            />
            <Button
              variant="secondary"
              onClick={loadSource}
              disabled={loading || sourceUrl.length < 4}
            >
              {t.load}
            </Button>
          </div>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {current && (
        <>
          {/* Current image */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-white/10" style={checkerStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={t.currentImage} className="mx-auto max-h-[480px]" />
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>{t.totalSpent(totalCredits)}</span>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-300 hover:underline"
              >
                {t.openFullSize}
              </a>
            </div>
          </div>

          {/* Edit controls */}
          <div className="space-y-4 surface p-5">
            <label className="block">
              <span className="field-label">{t.describeEdit}</span>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={2}
                placeholder={t.editPlaceholder}
                className="mt-1 field"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {t.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setInstruction(p)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-violet-300 hover:text-violet-300"
                >
                  {p}
                </button>
              ))}
            </div>

            <label className="block sm:max-w-[12rem]">
              <span className="field-label">{t.format}</span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="mt-1 field"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r === "original" ? t.original : r}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={applyEdit} disabled={loading || instruction.length < 2}>
                  {loading ? t.applying : t.applyEdit}
                </Button>
                <Button variant="ghost" onClick={reset} disabled={loading}>
                  {t.startOver}
                </Button>
              </div>
              <CostHint
                credits={estimateModuleCredits("editor")}
                note={t.costNote}
              />
            </div>
          </div>

          {/* Edit history */}
          {history.length > 1 && (
            <div className="space-y-2">
              <div className="field-label">{t.editHistory}</div>
              <div className="flex flex-wrap gap-3">
                {history.map((step, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => revertTo(i)}
                    disabled={loading}
                    title={step.instruction}
                    className={`overflow-hidden rounded-lg border transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
                      i === history.length - 1 ? "border-violet-400" : "border-white/10"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={step.url} alt={step.instruction} className="h-16 w-16 object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-400">{t.revertHint}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
