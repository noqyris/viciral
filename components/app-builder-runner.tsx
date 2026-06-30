"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";
import {
  RunnerLayout,
  Field,
  RunButton,
  RunnerNote,
  OutputPanel,
  RunnerLoading,
  RunnerError,
  RefineBar,
  AiAdvanced,
  CreditsReceipt,
} from "@/components/studio/runner-kit";

const APP_TYPES = ["landing-app", "dashboard", "catalog", "booking", "portfolio"] as const;

const T = {
  sr: {
    genError: "Greška pri generisanju",
    name: "Naziv aplikacije",
    namePh: "npr. Lunar",
    description: "Opis (čemu služi)",
    descriptionPh: "Šta aplikacija radi, kome je namenjena…",
    type: "Tip",
    screens: "Broj ekrana",
    building: "Pravim aplikaciju…",
    make: "Napravi aplikaciju",
    auto: "Auto",
    autoTitle: "Pusti AI (Opus) da odradi ceo proces",
    costNote: "tekst + slike ekrana",
    caveat:
      "MVP: interaktivna HTML aplikacija za preuzimanje (navigacija kroz ekrane). Bez hostinga / pravog backend-a — izvoz koda dolazi kasnije.",
    creditsUsedLabel: "Potrošeno kredita:",
    preview: "Pregled aplikacije",
    download: "Preuzmi HTML",
    output: "Aplikacija",
    empty: "Opiši aplikaciju pa će se ovde pojaviti interaktivni pregled (u stilu brenda).",
    loading: "Pravim tvoju aplikaciju…",
    refinePh: "Doradi: npr. toplije boje, dodaj ekran sa cenama…",
    refine: "Doradi",
    refineSuggest: ["Modernije", "Više boja", "Kraći tekst", "Dodaj CTA"],
    types: {
      "landing-app": "Landing app",
      dashboard: "Dashboard",
      catalog: "Katalog",
      booking: "Rezervacije",
      portfolio: "Portfolio",
    } as Record<string, string>,
  },
  en: {
    genError: "Generation failed",
    name: "App name",
    namePh: "e.g. Lunar",
    description: "Description (what it does)",
    descriptionPh: "What the app does, who it's for…",
    type: "Type",
    screens: "Screens",
    building: "Building app…",
    make: "Build app",
    auto: "Auto",
    autoTitle: "Let the AI (Opus) run the whole process",
    costNote: "text + screen images",
    caveat:
      "MVP: a downloadable interactive HTML app (screen navigation). No hosting / real backend — code export comes later.",
    creditsUsedLabel: "Credits used:",
    preview: "App preview",
    download: "Download HTML",
    output: "App",
    empty: "Describe the app and an interactive, on-brand preview will appear here.",
    loading: "Building your app…",
    refinePh: "Refine: e.g. 'warmer colors, add a pricing screen'…",
    refine: "Refine",
    refineSuggest: ["More modern", "More color", "Shorter text", "Add a CTA"],
    types: {
      "landing-app": "Landing app",
      dashboard: "Dashboard",
      catalog: "Catalog",
      booking: "Booking",
      portfolio: "Portfolio",
    } as Record<string, string>,
  },
} as const;

interface Asset {
  kind: string;
  url?: string | null;
  text?: string | null;
  meta?: { role?: string } | null;
}
interface GenResp {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function AppBuilderRunner({ initialInputs }: { initialInputs?: Record<string, unknown> }) {
  const t = T[useLocale()];
  const [appName, setAppName] = useState((initialInputs?.appName as string) ?? "");
  const [description, setDescription] = useState((initialInputs?.description as string) ?? "");
  const [appType, setAppType] = useState((initialInputs?.appType as string) ?? "landing-app");
  const [screens, setScreens] = useState((initialInputs?.screens as number) ?? 3);
  const [refine, setRefine] = useState("");
  const [quality, setQuality] = useState((initialInputs?.quality as string) ?? "best");
  const [effort, setEffort] = useState((initialInputs?.effort as string) ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  async function run(mode: "manual" | "auto") {
    setLoading(true);
    setError(null);
    setHtml(null);
    setCreditsUsed(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "app-builder",
          mode,
          inputs: { appName, description, appType, screens, refine, quality, ...(effort ? { effort } : {}) },
        }),
      });
      const data = (await res.json()) as GenResp;
      if (!res.ok) throw new Error(data.error ?? t.genError);
      const app = data.generation?.assets?.find((a) => a.kind === "text" && a.meta?.role === "app-html");
      setHtml(app?.text ?? null);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      setRefine("");
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName || "app"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const disabled = loading || appName.length < 2 || description.length < 2;

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.name}>
            <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder={t.namePh} className="field" />
          </Field>
          <Field label={t.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t.descriptionPh}
              className="field"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.type}>
              <select value={appType} onChange={(e) => setAppType(e.target.value)} className="field">
                {APP_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {t.types[a]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.screens}>
              <input
                type="number"
                min={2}
                max={6}
                value={screens}
                onChange={(e) => setScreens(Math.max(2, Math.min(6, Number(e.target.value) || 2)))}
                className="field"
              />
            </Field>
          </div>
          <AiAdvanced quality={quality} onQuality={setQuality} effort={effort} onEffort={setEffort} />
          <RunButton
            onClick={() => run("manual")}
            disabled={disabled}
            loading={loading}
            loadingLabel={t.building}
            cost={<CostHint credits={estimateModuleCredits("app-builder")} note={t.costNote} />}
          >
            {t.make}
          </RunButton>
          <Button variant="secondary" onClick={() => run("auto")} disabled={disabled} title={t.autoTitle} className="w-full gap-2">
            <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            {t.auto}
          </Button>
          <RunnerNote>{t.caveat}</RunnerNote>
        </div>
      }
      output={
        <OutputPanel
          title={t.output}
          isEmpty={!html && !loading && !error}
          emptyLabel={t.empty}
          actions={
            html ? (
              <Button variant="secondary" onClick={download}>
                {t.download}
              </Button>
            ) : undefined
          }
        >
          {error && <RunnerError>{error}</RunnerError>}
          {loading && <RunnerLoading label={t.loading} />}
          {html && (
            <>
              {creditsUsed != null && <CreditsReceipt label={t.creditsUsedLabel} used={creditsUsed} />}
              <iframe
                title={t.preview}
                srcDoc={html}
                sandbox="allow-scripts"
                className="h-[600px] w-full rounded-xl border border-white/10 bg-white"
              />
              <RefineBar
                value={refine}
                onChange={setRefine}
                onSubmit={() => run("manual")}
                loading={loading}
                placeholder={t.refinePh}
                submitLabel={t.refine}
                suggestions={t.refineSuggest}
              />
            </>
          )}
        </OutputPanel>
      }
    />
  );
}
