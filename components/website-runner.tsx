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
  OutputPanel,
  RunnerLoading,
  RunnerError,
  CreditsReceipt,
} from "@/components/studio/runner-kit";

const T = {
  sr: {
    genError: "Greška pri generisanju",
    siteName: "Naziv sajta / brenda",
    siteNamePlaceholder: "npr. Lunar Coffee",
    description: "Opis",
    descriptionPlaceholder: "Čime se baviš, kome se obraćaš…",
    goal: "Cilj sajta",
    goalPlaceholder: "npr. prikupi prijave, prodaj proizvod",
    building: "Pravim sajt…",
    makeSite: "Napravi sajt",
    auto: "Auto",
    autoTitle: "Pusti AI (Opus) da odradi ceo proces umesto tebe",
    costNote: "tekst + hero i slike sekcija",
    fallbackFile: "sajt",
    creditsUsed: (n: number) => `Potrošeno kredita: ${n}`,
    creditsUsedLabel: "Potrošeno kredita:",
    sitePreview: "Pregled sajta",
    downloadHtml: "Preuzmi HTML",
    outputTitle: "Sajt",
    emptyLabel: "Opiši svoj brend pa će se ovde pojaviti pregled spremnog sajta.",
    loading: "Pravim tvoj sajt…",
  },
  en: {
    genError: "Generation failed",
    siteName: "Site / brand name",
    siteNamePlaceholder: "e.g. Lunar Coffee",
    description: "Description",
    descriptionPlaceholder: "What you do, who you speak to…",
    goal: "Site goal",
    goalPlaceholder: "e.g. collect sign-ups, sell a product",
    building: "Building site…",
    makeSite: "Build site",
    auto: "Auto",
    autoTitle: "Let the AI (Opus) run the whole process for you",
    costNote: "text + hero and section images",
    fallbackFile: "site",
    creditsUsed: (n: number) => `Credits used: ${n}`,
    creditsUsedLabel: "Credits used:",
    sitePreview: "Site preview",
    downloadHtml: "Download HTML",
    outputTitle: "Site",
    emptyLabel: "Describe your brand and a preview of the finished site will appear here.",
    loading: "Building your site…",
  },
} as const;

interface Asset {
  id: string;
  kind: "image" | "video" | "text";
  url?: string | null;
  text?: string | null;
  meta?: { role?: string } | null;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function WebsiteRunner({
  supportsAuto,
  initialInputs,
}: {
  supportsAuto: boolean;
  initialInputs?: Record<string, unknown>;
}) {
  const [siteName, setSiteName] = useState((initialInputs?.siteName as string) ?? "");
  const [description, setDescription] = useState((initialInputs?.description as string) ?? "");
  const [goal, setGoal] = useState((initialInputs?.goal as string) ?? "");
  const t = T[useLocale()];

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
          moduleSlug: "website",
          mode,
          inputs: { siteName, description, goal },
        }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? t.genError);
      const site = data.generation?.assets?.find(
        (a) => a.kind === "text" && a.meta?.role === "site-html",
      );
      setHtml(site?.text ?? null);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
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
    a.download = `${siteName || t.fallbackFile}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const disabled = loading || siteName.length < 2 || description.length < 2;

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.siteName}>
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder={t.siteNamePlaceholder}
              className="field"
            />
          </Field>
          <Field label={t.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t.descriptionPlaceholder}
              className="field"
            />
          </Field>
          <Field label={t.goal}>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t.goalPlaceholder}
              className="field"
            />
          </Field>
          <RunButton
            onClick={() => run("manual")}
            disabled={disabled}
            loading={loading}
            loadingLabel={t.building}
            cost={<CostHint credits={estimateModuleCredits("website")} note={t.costNote} />}
          >
            {t.makeSite}
          </RunButton>
          {supportsAuto && (
            <Button
              variant="secondary"
              onClick={() => run("auto")}
              disabled={disabled}
              title={t.autoTitle}
              className="w-full gap-2"
            >
              <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              {t.auto}
            </Button>
          )}
        </div>
      }
      output={
        <OutputPanel
          title={t.outputTitle}
          isEmpty={!html && !loading && !error}
          emptyLabel={t.emptyLabel}
        >
          {error && <RunnerError>{error}</RunnerError>}
          {loading && <RunnerLoading label={t.loading} />}
          {html && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                {creditsUsed != null ? (
                  <CreditsReceipt label={t.creditsUsedLabel} used={creditsUsed} />
                ) : (
                  <span className="text-sm text-zinc-400">{t.sitePreview}</span>
                )}
                <Button variant="secondary" onClick={download}>
                  {t.downloadHtml}
                </Button>
              </div>
              <iframe
                title={t.sitePreview}
                srcDoc={html}
                sandbox="allow-scripts"
                className="h-[600px] w-full rounded-xl border border-white/10 bg-white"
              />
            </div>
          )}
        </OutputPanel>
      }
    />
  );
}
