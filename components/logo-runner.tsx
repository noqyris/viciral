"use client";

import { useState } from "react";
import { CostHint } from "@/components/cost-hint";
import { useGeneration } from "@/hooks/use-generation";
import type { GenerationAsset } from "@/components/runner-types";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { setBrandLogo } from "@/app/studio/brand/brand-actions";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerError,
  RefineBar,
  AiAdvanced,
  CreditsReceipt,
} from "@/components/studio/runner-kit";

const STYLE_KEYS = ["minimal", "geometric", "wordmark", "emblem", "mascot"] as const;

const T = {
  sr: {
    err: "Greška pri generisanju",
    name: "Naziv brenda",
    namePh: "npr. Lunar",
    style: "Stil",
    variants: "Varijanti",
    mono: "Monohromatski (crno-belo)",
    iconOnly: "Samo ikona (bez teksta)",
    generating: "Generišem…",
    make: "Napravi logoe",
    output: "Logo varijante",
    empty: "Unesi naziv i pokreni — SVG logo varijante u bojama brenda pojaviće se ovde.",
    creditsUsed: "Potrošeno kredita:",
    setLogo: "Postavi kao logo brenda",
    refinePh: "Doradi: npr. jednostavnije, druga ikona…",
    refine: "Doradi",
    refineSuggest: ["Jednostavnije", "Druga ikona", "Deblje linije", "Drugačiji font"],
    size: "Veličina",
    sizes: { square_hd: "Kvadrat", portrait_16_9: "Uspravno", landscape_16_9: "Položeno" } as Record<string, string>,
    styles: {
      minimal: "Minimalan",
      geometric: "Geometrijski",
      wordmark: "Wordmark",
      emblem: "Amblem",
      mascot: "Maskota",
    } as Record<string, string>,
  },
  en: {
    err: "Generation failed",
    name: "Brand name",
    namePh: "e.g. Lunar",
    style: "Style",
    variants: "Variants",
    mono: "Monochrome (black & white)",
    iconOnly: "Icon only (no text)",
    generating: "Generating…",
    make: "Make logos",
    output: "Logo variants",
    empty: "Enter a name and run — on-brand SVG logo variants will appear here.",
    creditsUsed: "Credits used:",
    setLogo: "Set as brand logo",
    refinePh: "Refine: e.g. simpler, different icon…",
    refine: "Refine",
    refineSuggest: ["Simpler", "Different icon", "Bolder lines", "Different font"],
    size: "Size",
    sizes: { square_hd: "Square", portrait_16_9: "Portrait", landscape_16_9: "Landscape" } as Record<string, string>,
    styles: {
      minimal: "Minimal",
      geometric: "Geometric",
      wordmark: "Wordmark",
      emblem: "Emblem",
      mascot: "Mascot",
    } as Record<string, string>,
  },
} as const;

export function LogoRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [brandName, setBrandName] = useState((initialInputs?.brandName as string) ?? "");
  const [style, setStyle] = useState((initialInputs?.style as string) ?? "minimal");
  const [variants, setVariants] = useState((initialInputs?.variants as number) ?? 3);
  const [monochrome, setMonochrome] = useState(Boolean(initialInputs?.monochrome));
  const [iconOnly, setIconOnly] = useState(Boolean(initialInputs?.iconOnly));
  const [refine, setRefine] = useState("");
  const [imageSize, setImageSize] = useState((initialInputs?.imageSize as string) ?? "square_hd");
  const [quality, setQuality] = useState((initialInputs?.quality as string) ?? "balanced");
  const [effort, setEffort] = useState((initialInputs?.effort as string) ?? "");

  const { loading, error, assets, creditsUsed, run } = useGeneration("logo", { errorLabel: t.err });

  async function submit() {
    const g = await run({ brandName, style, variants, monochrome, iconOnly, refine, imageSize, quality, ...(effort ? { effort } : {}) });
    if (g) setRefine("");
  }

  const logos = assets.filter(
    (a): a is GenerationAsset & { url: string } => a.kind === "image" && a.meta?.role === "logo" && Boolean(a.url),
  );
  const isEmpty = !loading && !error && logos.length === 0 && creditsUsed == null;

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.name}>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder={t.namePh}
              className="field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.style}>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="field">
                {STYLE_KEYS.map((s) => (
                  <option key={s} value={s}>
                    {t.styles[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.variants}>
              <input
                type="number"
                min={1}
                max={4}
                value={variants}
                onChange={(e) => setVariants(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
                className="field"
              />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} className="accent-violet-500" />
              {t.mono}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={iconOnly} onChange={(e) => setIconOnly(e.target.checked)} className="accent-violet-500" />
              {t.iconOnly}
            </label>
          </div>

          <AiAdvanced
            quality={quality}
            onQuality={setQuality}
            effort={effort}
            onEffort={setEffort}
            extra={
              <Field label={t.size}>
                <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="field">
                  {["square_hd", "portrait_16_9", "landscape_16_9"].map((s) => (
                    <option key={s} value={s}>
                      {t.sizes[s]}
                    </option>
                  ))}
                </select>
              </Field>
            }
          />

          <RunButton
            onClick={submit}
            disabled={loading || brandName.length < 2}
            loading={loading}
            loadingLabel={t.generating}
            cost={<CostHint credits={estimateModuleCredits("logo", { variants })} />}
          >
            {t.make}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel title={t.output} isEmpty={isEmpty} emptyLabel={t.empty}>
          {error && <RunnerError>{error}</RunnerError>}
          {creditsUsed != null && <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />}
          {logos.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {logos.map((a, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt="" className="max-h-full max-w-full object-contain p-3" />
                  </div>
                  <form action={setBrandLogo.bind(null, a.url as string)}>
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-400/40 hover:text-violet-200"
                    >
                      {t.setLogo}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
          {logos.length > 0 && (
            <RefineBar
              value={refine}
              onChange={setRefine}
              onSubmit={submit}
              loading={loading}
              placeholder={t.refinePh}
              submitLabel={t.refine}
              suggestions={t.refineSuggest}
            />
          )}
        </OutputPanel>
      }
    />
  );
}
