"use client";

import { useState } from "react";
import { Zap, Plus, X, ChevronUp, ChevronDown, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { useGeneration } from "@/hooks/use-generation";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import { downloadHtml } from "@/lib/download";
import {
  RunnerLayout,
  Field,
  RunButton,
  OutputPanel,
  RunnerLoading,
  RunnerError,
  RefineBar,
  AiAdvanced,
  CreditsReceipt,
} from "@/components/studio/runner-kit";

const SECTION_KINDS = [
  "feature-grid", "steps", "stats", "testimonials", "logo-cloud", "pricing",
  "faq", "gallery", "about", "team", "cta", "contact", "newsletter", "text-block",
] as const;
type Kind = (typeof SECTION_KINDS)[number];
interface Pick {
  kind: Kind;
  title: string;
  image: boolean;
}
type Device = "desktop" | "tablet" | "mobile";
const DEVICE_W: Record<Device, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

const T = {
  sr: {
    genError: "Greška pri generisanju",
    basics: "Osnovno",
    siteName: "Naziv sajta / brenda",
    siteNamePh: "npr. Lunar Coffee",
    description: "Opis",
    descriptionPh: "Čime se baviš, kome se obraćaš…",
    goal: "Cilj sajta / CTA",
    goalPh: "npr. prikupi prijave, prodaj proizvod",
    siteType: "Tip sajta",
    look: "Izgled i stil",
    theme: "Tema",
    mode: "Svetlina",
    density: "Gustina",
    roundness: "Zaobljenost",
    font: "Font",
    width: "Širina",
    accent: "Akcenat",
    accentColor: "Boja akcenta",
    ignoreBrand: "Ignoriši brend",
    content: "Sadržaj i jezik",
    language: "Jezik",
    tone: "Ton (opciono)",
    copyLength: "Dužina teksta",
    sections: "Sekcije",
    sectionsHint: "Prazno = AI bira automatski",
    addSection: "Dodaj sekciju…",
    titleHint: "Naslov (opciono)",
    image: "slika",
    seo: "SEO i meta",
    seoTitle: "SEO naslov",
    seoDesc: "SEO opis",
    favicon: "Favicon",
    socialImage: "OG slika (za deljenje)",
    images: "Slike",
    building: "Pravim sajt…",
    makeSite: "Napravi sajt",
    auto: "Auto",
    autoTitle: "Pusti AI (Opus) da odradi ceo proces umesto tebe",
    costNote: "tekst + slike (po izboru)",
    fallbackFile: "sajt",
    creditsUsedLabel: "Potrošeno kredita:",
    sitePreview: "Pregled sajta",
    downloadHtml: "Preuzmi HTML",
    copyHtml: "Kopiraj",
    copied: "Kopirano!",
    outputTitle: "Sajt",
    emptyLabel: "Opiši svoj brend pa će se ovde pojaviti pregled spremnog sajta.",
    loading: "Pravim tvoj sajt…",
    refinePh: "Doradi: npr. dodaj cenovnik, drugačiji ton…",
    refineLabel: "Doradi",
    refineSuggest: ["Dodaj cenovnik", "Više sekcija", "Drugačiji ton", "Tamna tema"],
    opts: {
      siteType: { landing: "Landing", onePager: "One-pager", multiSection: "Više sekcija", portfolio: "Portfolio", product: "Proizvod", event: "Događaj" },
      theme: { auto: "Auto", minimal: "Minimal", bold: "Bold", elegant: "Elegant", corporate: "Corporate" },
      mode: { auto: "Auto", light: "Svetla", dark: "Tamna" },
      density: { auto: "Auto", compact: "Kompaktno", cozy: "Ugodno", spacious: "Prostrano" },
      roundness: { auto: "Auto", sharp: "Oštro", subtle: "Suptilno", rounded: "Zaobljeno", pill: "Pilula" },
      font: { auto: "Auto", system: "Sistemski", "sans-modern": "Sans", "serif-editorial": "Editorial", geometric: "Geometrijski", "elegant-serif": "Elegantni serif" },
      width: { auto: "Auto", narrow: "Usko", standard: "Standardno", wide: "Široko" },
      accent: { brand: "Brend", custom: "Prilagođeno", auto: "Auto" },
      copyLength: { short: "Kratko", medium: "Srednje", long: "Dugačko" },
      favicon: { initial: "Početno slovo", "accent-dot": "Tačka", none: "Bez" },
      images: { hero: "Samo hero", all: "Sve sekcije", none: "Bez slika" },
    },
    kinds: {
      "feature-grid": "Mogućnosti", steps: "Koraci", stats: "Statistika", testimonials: "Utisci", "logo-cloud": "Logotipi", pricing: "Cenovnik", faq: "FAQ", gallery: "Galerija", about: "O nama", team: "Tim", cta: "Poziv na akciju", contact: "Kontakt", newsletter: "Newsletter", "text-block": "Tekst",
    } as Record<string, string>,
  },
  en: {
    genError: "Generation failed",
    basics: "Basics",
    siteName: "Site / brand name",
    siteNamePh: "e.g. Lunar Coffee",
    description: "Description",
    descriptionPh: "What you do, who you speak to…",
    goal: "Site goal / CTA",
    goalPh: "e.g. collect sign-ups, sell a product",
    siteType: "Site type",
    look: "Look & feel",
    theme: "Theme",
    mode: "Mode",
    density: "Density",
    roundness: "Roundness",
    font: "Font",
    width: "Width",
    accent: "Accent",
    accentColor: "Accent color",
    ignoreBrand: "Ignore brand",
    content: "Content & language",
    language: "Language",
    tone: "Tone (optional)",
    copyLength: "Copy length",
    sections: "Sections",
    sectionsHint: "Empty = AI picks automatically",
    addSection: "Add section…",
    titleHint: "Title (optional)",
    image: "image",
    seo: "SEO & meta",
    seoTitle: "SEO title",
    seoDesc: "SEO description",
    favicon: "Favicon",
    socialImage: "OG image (for sharing)",
    images: "Images",
    building: "Building site…",
    makeSite: "Build site",
    auto: "Auto",
    autoTitle: "Let the AI (Opus) run the whole process for you",
    costNote: "text + images (your choice)",
    fallbackFile: "site",
    creditsUsedLabel: "Credits used:",
    sitePreview: "Site preview",
    downloadHtml: "Download HTML",
    copyHtml: "Copy",
    copied: "Copied!",
    outputTitle: "Site",
    emptyLabel: "Describe your brand and a preview of the finished site will appear here.",
    loading: "Building your site…",
    refinePh: "Refine: e.g. add pricing, different tone…",
    refineLabel: "Refine",
    refineSuggest: ["Add pricing", "More sections", "Different tone", "Dark theme"],
    opts: {
      siteType: { landing: "Landing", onePager: "One-pager", multiSection: "Multi-section", portfolio: "Portfolio", product: "Product", event: "Event" },
      theme: { auto: "Auto", minimal: "Minimal", bold: "Bold", elegant: "Elegant", corporate: "Corporate" },
      mode: { auto: "Auto", light: "Light", dark: "Dark" },
      density: { auto: "Auto", compact: "Compact", cozy: "Cozy", spacious: "Spacious" },
      roundness: { auto: "Auto", sharp: "Sharp", subtle: "Subtle", rounded: "Rounded", pill: "Pill" },
      font: { auto: "Auto", system: "System", "sans-modern": "Sans", "serif-editorial": "Editorial", geometric: "Geometric", "elegant-serif": "Elegant serif" },
      width: { auto: "Auto", narrow: "Narrow", standard: "Standard", wide: "Wide" },
      accent: { brand: "Brand", custom: "Custom", auto: "Auto" },
      copyLength: { short: "Short", medium: "Medium", long: "Long" },
      favicon: { initial: "Initial", "accent-dot": "Dot", none: "None" },
      images: { hero: "Hero only", all: "All sections", none: "No images" },
    },
    kinds: {
      "feature-grid": "Features", steps: "Steps", stats: "Stats", testimonials: "Testimonials", "logo-cloud": "Logos", pricing: "Pricing", faq: "FAQ", gallery: "Gallery", about: "About", team: "Team", cta: "Call to action", contact: "Contact", newsletter: "Newsletter", "text-block": "Text",
    } as Record<string, string>,
  },
} as const;

function Group({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="rounded-xl border border-white/10 bg-white/[0.02]">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-zinc-200">{title}</summary>
      <div className="space-y-4 border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

export function WebsiteRunner({
  supportsAuto,
  initialInputs,
}: {
  supportsAuto: boolean;
  initialInputs?: Record<string, unknown>;
}) {
  const t = T[useLocale()];
  const init = initialInputs ?? {};
  const [siteName, setSiteName] = useState((init.siteName as string) ?? "");
  const [description, setDescription] = useState((init.description as string) ?? "");
  const [goalCta, setGoalCta] = useState((init.goalCta as string) ?? (init.goal as string) ?? "");
  const [siteType, setSiteType] = useState((init.siteType as string) ?? "landing");
  const [theme, setTheme] = useState((init.theme as string) ?? "auto");
  const [mode, setMode] = useState((init.mode as string) ?? "auto");
  const [density, setDensity] = useState((init.density as string) ?? "auto");
  const [roundness, setRoundness] = useState((init.roundness as string) ?? "auto");
  const [fontPairing, setFontPairing] = useState((init.fontPairing as string) ?? "auto");
  const [contentWidth, setContentWidth] = useState((init.contentWidth as string) ?? "auto");
  const [accentMode, setAccentMode] = useState((init.accentMode as string) ?? "brand");
  const [accentColor, setAccentColor] = useState((init.accentColor as string) ?? "#7c3aed");
  const [ignoreBrand, setIgnoreBrand] = useState((init.ignoreBrand as boolean) ?? false);
  const [language, setLanguage] = useState((init.language as string) ?? "sr");
  const [toneOverride, setToneOverride] = useState((init.toneOverride as string) ?? "");
  const [copyLength, setCopyLength] = useState((init.copyLength as string) ?? "medium");
  const [sections, setSections] = useState<Pick[]>((init.sections as Pick[]) ?? []);
  const [seoTitle, setSeoTitle] = useState((init.seoTitle as string) ?? "");
  const [seoDescription, setSeoDescription] = useState((init.seoDescription as string) ?? "");
  const [favicon, setFavicon] = useState((init.favicon as string) ?? "initial");
  const [socialImage, setSocialImage] = useState((init.socialImage as boolean) ?? false);
  const [imagesMode, setImagesMode] = useState((init.imagesMode as string) ?? "hero");
  const [refine, setRefine] = useState("");
  const [quality, setQuality] = useState((init.quality as string) ?? "best");
  const [effort, setEffort] = useState((init.effort as string) ?? "");

  const { loading, error, assets, creditsUsed, run } = useGeneration("website", { errorLabel: t.genError });
  const html = assets.find((a) => a.kind === "text" && a.meta?.role === "site-html")?.text ?? null;
  const [device, setDevice] = useState<Device>("desktop");
  const [copied, setCopied] = useState(false);

  function addSection(kind: Kind) {
    setSections((s) => (s.length >= 6 ? s : [...s, { kind, title: "", image: false }]));
  }
  function updateSection(i: number, patch: Partial<Pick>) {
    setSections((s) => s.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }
  function removeSection(i: number) {
    setSections((s) => s.filter((_, j) => j !== i));
  }
  function moveSection(i: number, dir: -1 | 1) {
    setSections((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  const inputs = {
    siteName, description, goalCta, siteType, theme, mode, density, roundness, fontPairing,
    contentWidth, accentMode, accentColor, ignoreBrand, language, toneOverride, copyLength,
    sections, seoTitle, seoDescription, favicon, socialImage, imagesMode, refine,
    quality, ...(effort ? { effort } : {}),
  };

  async function submit(genMode: "manual" | "auto") {
    const g = await run(inputs, genMode);
    if (g) setRefine("");
  }

  function download() {
    if (html) downloadHtml(html, `${siteName || t.fallbackFile}.html`);
  }
  async function copy() {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const disabled = loading || siteName.length < 2 || description.length < 2;
  const sel = (value: string, set: (v: string) => void, opts: Record<string, string>) => (
    <select value={value} onChange={(e) => set(e.target.value)} className="field">
      {Object.entries(opts).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <RunnerLayout
      controls={
        <div className="space-y-3">
          {/* Basics */}
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <Field label={t.siteName}>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder={t.siteNamePh} className="field" />
            </Field>
            <Field label={t.description}>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t.descriptionPh} className="field" />
            </Field>
            <Field label={t.goal}>
              <input value={goalCta} onChange={(e) => setGoalCta(e.target.value)} placeholder={t.goalPh} className="field" />
            </Field>
            <Field label={t.siteType}>{sel(siteType, setSiteType, t.opts.siteType)}</Field>
          </div>

          {/* Look & feel */}
          <Group title={t.look}>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.theme}>{sel(theme, setTheme, t.opts.theme)}</Field>
              <Field label={t.mode}>{sel(mode, setMode, t.opts.mode)}</Field>
              <Field label={t.density}>{sel(density, setDensity, t.opts.density)}</Field>
              <Field label={t.roundness}>{sel(roundness, setRoundness, t.opts.roundness)}</Field>
              <Field label={t.font}>{sel(fontPairing, setFontPairing, t.opts.font)}</Field>
              <Field label={t.width}>{sel(contentWidth, setContentWidth, t.opts.width)}</Field>
              <Field label={t.accent}>{sel(accentMode, setAccentMode, t.opts.accent)}</Field>
              {accentMode === "custom" && (
                <Field label={t.accentColor}>
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="field h-10 p-1" />
                </Field>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={ignoreBrand} onChange={(e) => setIgnoreBrand(e.target.checked)} />
              {t.ignoreBrand}
            </label>
          </Group>

          {/* Content & language */}
          <Group title={t.content}>
            <div className="grid grid-cols-3 gap-4">
              <Field label={t.language}>{sel(language, setLanguage, { sr: "SR", en: "EN", de: "DE", fr: "FR", es: "ES", hr: "HR" })}</Field>
              <Field label={t.copyLength}>{sel(copyLength, setCopyLength, t.opts.copyLength)}</Field>
              <Field label={t.tone}>
                <input value={toneOverride} onChange={(e) => setToneOverride(e.target.value)} className="field" />
              </Field>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="field-label">{t.sections}</span>
                <span className="text-xs text-zinc-500">{t.sectionsHint}</span>
              </div>
              <div className="space-y-2">
                {sections.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                    <span className="w-24 shrink-0 truncate text-sm text-zinc-300">{t.kinds[row.kind]}</span>
                    <input
                      value={row.title}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                      placeholder={t.titleHint}
                      className="field h-8 flex-1 py-1 text-sm"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                      <input type="checkbox" checked={row.image} onChange={(e) => updateSection(i, { image: e.target.checked })} />
                      {t.image}
                    </label>
                    <button type="button" onClick={() => moveSection(i, -1)} className="text-zinc-500 hover:text-zinc-200" aria-label="up">
                      <ChevronUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveSection(i, 1)} className="text-zinc-500 hover:text-zinc-200" aria-label="down">
                      <ChevronDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => removeSection(i)} className="text-zinc-500 hover:text-rose-300" aria-label="remove">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              {sections.length < 6 && (
                <div className="mt-2 flex items-center gap-2">
                  <Plus className="size-4 text-zinc-500" />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addSection(e.target.value as Kind);
                      e.target.value = "";
                    }}
                    className="field h-8 py-1 text-sm"
                  >
                    <option value="">{t.addSection}</option>
                    {SECTION_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {t.kinds[k]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Group>

          {/* SEO & meta */}
          <Group title={t.seo}>
            <Field label={t.seoTitle}>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="field" />
            </Field>
            <Field label={t.seoDesc}>
              <input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="field" />
            </Field>
            <div className="grid grid-cols-2 items-end gap-4">
              <Field label={t.favicon}>{sel(favicon, setFavicon, t.opts.favicon)}</Field>
              <label className="flex h-10 items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={socialImage} onChange={(e) => setSocialImage(e.target.checked)} />
                {t.socialImage}
              </label>
            </div>
          </Group>

          {/* Images gate (cost-dominant) */}
          <Field label={t.images}>{sel(imagesMode, setImagesMode, t.opts.images)}</Field>

          <AiAdvanced quality={quality} onQuality={setQuality} effort={effort} onEffort={setEffort} />

          <RunButton
            onClick={() => submit("manual")}
            disabled={disabled}
            loading={loading}
            loadingLabel={t.building}
            cost={
              <CostHint
                credits={estimateModuleCredits("website", { imagesMode, sections, copyLength, socialImage })}
                note={t.costNote}
              />
            }
          >
            {t.makeSite}
          </RunButton>
          {supportsAuto && (
            <Button variant="secondary" onClick={() => submit("auto")} disabled={disabled} title={t.autoTitle} className="w-full gap-2">
              <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              {t.auto}
            </Button>
          )}
        </div>
      }
      output={
        <OutputPanel title={t.outputTitle} isEmpty={!html && !loading && !error} emptyLabel={t.emptyLabel}>
          {error && <RunnerError>{error}</RunnerError>}
          {loading && <RunnerLoading label={t.loading} />}
          {html && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {creditsUsed != null ? (
                  <CreditsReceipt label={t.creditsUsedLabel} used={creditsUsed} />
                ) : (
                  <span className="text-sm text-zinc-400">{t.sitePreview}</span>
                )}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                    {(["desktop", "tablet", "mobile"] as const).map((dv) => {
                      const Icon = dv === "desktop" ? Monitor : dv === "tablet" ? Tablet : Smartphone;
                      return (
                        <button
                          key={dv}
                          type="button"
                          onClick={() => setDevice(dv)}
                          aria-pressed={device === dv}
                          className={`rounded-md p-1.5 transition-colors ${device === dv ? "bg-violet-500/20 text-violet-200" : "text-zinc-500 hover:text-zinc-200"}`}
                        >
                          <Icon className="size-4" />
                        </button>
                      );
                    })}
                  </div>
                  <Button variant="secondary" onClick={copy}>
                    {copied ? t.copied : t.copyHtml}
                  </Button>
                  <Button variant="secondary" onClick={download}>
                    {t.downloadHtml}
                  </Button>
                </div>
              </div>
              <div className="flex justify-center overflow-hidden rounded-xl border border-white/10 bg-white">
                <iframe
                  title={t.sitePreview}
                  srcDoc={html}
                  sandbox="allow-scripts"
                  style={{ width: DEVICE_W[device] }}
                  className="h-[640px] w-full transition-[width] duration-200"
                />
              </div>
              <RefineBar
                value={refine}
                onChange={setRefine}
                onSubmit={() => submit("manual")}
                loading={loading}
                placeholder={t.refinePh}
                submitLabel={t.refineLabel}
                suggestions={t.refineSuggest}
              />
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
