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
  RefineBar,
  AdvancedSection,
  CreditsReceipt,
} from "@/components/studio/runner-kit";

const ASPECTS = ["1:1", "4:5", "2:3", "3:4", "9:16", "16:9", "1.91:1"] as const;
const STYLE_KEYS = [
  "auto",
  "photo",
  "cinematic",
  "illustration",
  "3d",
  "flat",
  "minimal",
  "anime",
  "watercolor",
  "lineart",
  "product",
  "poster",
] as const;
const LIGHT_KEYS = ["auto", "natural", "studio", "golden", "dramatic", "soft", "neon"] as const;

const T = {
  sr: {
    err: "Greška pri generisanju",
    prompt: "Opis slike",
    promptPh: "npr. proizvod na čistoj studijskoj pozadini, topla svetlost",
    aspect: "Format",
    variants: "Varijanti",
    style: "Stil",
    lighting: "Svetlo",
    negative: "Izbegavaj (negativ)",
    negativePh: "npr. tekst, vodeni žig",
    reference: "Referentna slika (URL)",
    referencePh: "https://…/referenca.png",
    enhance: "Poboljšaj opis (AI proširi)",
    useBrand: "U stilu brenda",
    optional: "opciono",
    generating: "Generišem…",
    make: "Napravi slike",
    output: "Rezultat",
    empty: "Unesi opis i pokreni — slike (u stilu brenda) pojaviće se ovde.",
    creditsUsed: "Potrošeno kredita:",
    refinePh: "Doradi: npr. toplije svetlo, drugačiji ugao…",
    refine: "Doradi",
    refineSuggest: ["Toplije svetlo", "Drugačiji ugao", "Više detalja", "Čistija pozadina"],
    advanced: "Napredno",
    model: "Model",
    modelStd: "Standard",
    modelPro: "Pro (HD, najbolji tekst)",
    outputFormat: "Format fajla",
    seed: "Seed",
    seedPh: "nasumično",
    safety: "Strogost filtera",
    styles: {
      auto: "Automatski",
      photo: "Foto",
      cinematic: "Kinematski",
      illustration: "Ilustracija",
      "3d": "3D",
      flat: "Flat",
      minimal: "Minimalno",
      anime: "Anime",
      watercolor: "Akvarel",
      lineart: "Linijski",
      product: "Proizvod",
      poster: "Poster",
    } as Record<string, string>,
    lights: {
      auto: "Automatsko",
      natural: "Prirodno",
      studio: "Studijsko",
      golden: "Zlatni sat",
      dramatic: "Dramatično",
      soft: "Meko",
      neon: "Neon",
    } as Record<string, string>,
  },
  en: {
    err: "Generation failed",
    prompt: "Image description",
    promptPh: "e.g. product on a clean studio background, warm light",
    aspect: "Aspect",
    variants: "Variants",
    style: "Style",
    lighting: "Lighting",
    negative: "Avoid (negative)",
    negativePh: "e.g. text, watermark",
    reference: "Reference image (URL)",
    referencePh: "https://…/reference.png",
    enhance: "Enhance prompt (AI expands)",
    useBrand: "In brand style",
    optional: "optional",
    generating: "Generating…",
    make: "Make images",
    output: "Output",
    empty: "Enter a description and run — on-brand images will appear here.",
    creditsUsed: "Credits used:",
    refinePh: "Refine: e.g. warmer light, different angle…",
    refine: "Refine",
    refineSuggest: ["Warmer light", "Different angle", "More detail", "Cleaner background"],
    advanced: "Advanced",
    model: "Model",
    modelStd: "Standard",
    modelPro: "Pro (HD, best text)",
    outputFormat: "File format",
    seed: "Seed",
    seedPh: "random",
    safety: "Safety filter",
    styles: {
      auto: "Auto",
      photo: "Photo",
      cinematic: "Cinematic",
      illustration: "Illustration",
      "3d": "3D",
      flat: "Flat",
      minimal: "Minimal",
      anime: "Anime",
      watercolor: "Watercolor",
      lineart: "Line art",
      product: "Product",
      poster: "Poster",
    } as Record<string, string>,
    lights: {
      auto: "Auto",
      natural: "Natural",
      studio: "Studio",
      golden: "Golden hour",
      dramatic: "Dramatic",
      soft: "Soft",
      neon: "Neon",
    } as Record<string, string>,
  },
} as const;

interface Asset {
  kind: string;
  url?: string;
}
interface GenResp {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function ImageRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [prompt, setPrompt] = useState((initialInputs?.prompt as string) ?? "");
  const [aspectRatio, setAspectRatio] = useState((initialInputs?.aspectRatio as string) ?? "1:1");
  const [variants, setVariants] = useState((initialInputs?.variants as number) ?? 2);
  const [style, setStyle] = useState((initialInputs?.style as string) ?? "auto");
  const [lighting, setLighting] = useState((initialInputs?.lighting as string) ?? "auto");
  const [negativePrompt, setNegativePrompt] = useState((initialInputs?.negativePrompt as string) ?? "");
  const [referenceUrl, setReferenceUrl] = useState((initialInputs?.referenceUrl as string) ?? "");
  const [enhancePrompt, setEnhancePrompt] = useState((initialInputs?.enhancePrompt as boolean) ?? false);
  const [useBrand, setUseBrand] = useState((initialInputs?.useBrand as boolean) ?? true);
  const [refine, setRefine] = useState("");
  const [model, setModel] = useState((initialInputs?.model as string) ?? "nano-banana");
  const [outputFormat, setOutputFormat] = useState((initialInputs?.outputFormat as string) ?? "png");
  const [seed, setSeed] = useState((initialInputs?.seed as number)?.toString() ?? "");
  const [safetyTolerance, setSafetyTolerance] = useState((initialInputs?.safetyTolerance as string) ?? "4");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setAssets(null);
    setCreditsUsed(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "image",
          mode: "manual",
          inputs: {
            prompt,
            aspectRatio,
            variants,
            style,
            lighting,
            negativePrompt,
            referenceUrl,
            enhancePrompt,
            useBrand,
            refine,
            model,
            outputFormat,
            safetyTolerance,
            ...(seed.trim() !== "" && !Number.isNaN(Number(seed)) ? { seed: Number(seed) } : {}),
          },
        }),
      });
      const data = (await res.json()) as GenResp;
      if (!res.ok) throw new Error(data.error ?? t.err);
      setAssets(data.generation?.assets ?? []);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      setRefine("");
      notifyCreditsChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const images = assets?.filter((a) => a.kind === "image" && a.url) ?? [];
  const isEmpty = !loading && !error && images.length === 0 && creditsUsed == null;

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.prompt}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={t.promptPh}
              className="field"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={enhancePrompt}
              onChange={(e) => setEnhancePrompt(e.target.checked)}
            />
            {t.enhance}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.aspect}>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="field">
                {ASPECTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
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
            <Field label={t.lighting}>
              <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="field">
                {LIGHT_KEYS.map((l) => (
                  <option key={l} value={l}>
                    {t.lights[l]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.negative} hint={t.optional}>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={t.negativePh}
              className="field"
            />
          </Field>

          <Field label={t.reference} hint={t.optional}>
            <input
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder={t.referencePh}
              className="field"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={useBrand} onChange={(e) => setUseBrand(e.target.checked)} />
            {t.useBrand}
          </label>

          <AdvancedSection title={t.advanced}>
            <Field label={t.model}>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="field">
                <option value="nano-banana">{t.modelStd}</option>
                <option value="nano-banana-pro">{t.modelPro}</option>
                <option value="gpt-image">GPT Image</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.outputFormat}>
                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="field">
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </Field>
              <Field label={t.safety}>
                <select value={safetyTolerance} onChange={(e) => setSafetyTolerance(e.target.value)} className="field">
                  {["1", "2", "3", "4", "5", "6"].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t.seed} hint={t.optional}>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder={t.seedPh}
                inputMode="numeric"
                className="field"
              />
            </Field>
          </AdvancedSection>

          <RunButton
            onClick={run}
            disabled={loading || prompt.length < 2}
            loading={loading}
            loadingLabel={t.generating}
            cost={<CostHint credits={estimateModuleCredits("image", { variants, enhancePrompt, model })} />}
          >
            {t.make}
          </RunButton>
        </div>
      }
      output={
        <OutputPanel title={t.output} isEmpty={isEmpty} emptyLabel={t.empty}>
          {error && <RunnerError>{error}</RunnerError>}
          {creditsUsed != null && <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />}
          {images.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {images.map((a, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt="" className="w-full" />
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <RefineBar
              value={refine}
              onChange={setRefine}
              onSubmit={run}
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
