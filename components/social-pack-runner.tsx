"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
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
import { useGeneration } from "@/hooks/use-generation";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";

const FORMAT_KEYS = ["single", "carousel", "story"] as const;
const LENGTH_KEYS = ["short", "medium", "long"] as const;

const T = {
  sr: {
    genError: "Greška pri generisanju",
    topic: "Tema",
    topicPlaceholder: "npr. lansiranje nove kolekcije patika",
    platform: "Platforma",
    postCount: "Broj objava",
    tone: "Ton",
    variantsPerPost: "Varijanti po objavi",
    format: "Format",
    captionLength: "Dužina teksta",
    hashtagCount: "Hashtagova",
    language: "Jezik",
    includeCta: "Poziv na akciju (CTA)",
    useEmoji: "Emodžiji",
    includeImage: "Generiši slike",
    generating: "Generišem…",
    make: "Napravi",
    auto: "Auto",
    autoTitle: "Pusti AI (Opus) da odradi ceo proces umesto tebe",
    autoNote: "Auto: AI vodi ceo proces",
    creditsUsed: "Potrošeno kredita:",
    readyToPublish: "Spremno za objavu?",
    scheduleInCalendar: "Zakaži u kalendaru →",
    generatedImage: (i: number) => `Generisana slika ${i}`,
    outputTitle: "Rezultat",
    emptyLabel: "Unesi temu i pokreni — slike i tekstovi objava pojaviće se ovde.",
    refinePh: "Doradi: npr. duhovitije, drugačiji CTA…",
    refine: "Doradi",
    refineSuggest: ["Duhovitije", "Kraće", "Drugačiji CTA", "Više hashtagova"],
    formats: { single: "Jedna objava", carousel: "Carousel", story: "Story" } as Record<string, string>,
    lengths: { short: "Kratko", medium: "Srednje", long: "Dugačko" } as Record<string, string>,
  },
  en: {
    genError: "Generation failed",
    topic: "Topic",
    topicPlaceholder: "e.g. launching a new sneaker collection",
    platform: "Platform",
    postCount: "Number of posts",
    tone: "Tone",
    variantsPerPost: "Variants per post",
    format: "Format",
    captionLength: "Caption length",
    hashtagCount: "Hashtags",
    language: "Language",
    includeCta: "Call to action (CTA)",
    useEmoji: "Emojis",
    includeImage: "Generate images",
    generating: "Generating…",
    make: "Create",
    auto: "Auto",
    autoTitle: "Let the AI (Opus) run the whole process for you",
    autoNote: "Auto: AI runs the whole process",
    creditsUsed: "Credits used:",
    readyToPublish: "Ready to publish?",
    scheduleInCalendar: "Schedule in calendar →",
    generatedImage: (i: number) => `Generated image ${i}`,
    outputTitle: "Output",
    emptyLabel: "Enter a topic and run — your post images and captions will appear here.",
    refinePh: "Refine: e.g. funnier, different CTA…",
    refine: "Refine",
    refineSuggest: ["Funnier", "Shorter", "Different CTA", "More hashtags"],
    formats: { single: "Single post", carousel: "Carousel", story: "Story" } as Record<string, string>,
    lengths: { short: "Short", medium: "Medium", long: "Long" } as Record<string, string>,
  },
} as const;


export function SocialPackRunner({
  supportsAuto,
  initialInputs,
}: {
  supportsAuto: boolean;
  initialInputs?: Record<string, unknown>;
}) {
  const [topic, setTopic] = useState((initialInputs?.topic as string) ?? "");
  const [platform, setPlatform] = useState((initialInputs?.platform as string) ?? "instagram");
  const [postCount, setPostCount] = useState((initialInputs?.postCount as number) ?? 3);
  const [tone, setTone] = useState((initialInputs?.tone as string) ?? "prijateljski");
  const [variantsPerPost, setVariantsPerPost] = useState(
    (initialInputs?.variantsPerPost as number) ?? 1,
  );
  const [format, setFormat] = useState((initialInputs?.format as string) ?? "single");
  const [captionLength, setCaptionLength] = useState((initialInputs?.captionLength as string) ?? "medium");
  const [hashtagCount, setHashtagCount] = useState((initialInputs?.hashtagCount as number) ?? 5);
  const [language, setLanguage] = useState((initialInputs?.language as string) ?? "sr");
  const [includeCta, setIncludeCta] = useState((initialInputs?.includeCta as boolean) ?? true);
  const [useEmoji, setUseEmoji] = useState((initialInputs?.useEmoji as boolean) ?? true);
  const [includeImage, setIncludeImage] = useState((initialInputs?.includeImage as boolean) ?? true);
  const [refine, setRefine] = useState("");
  const [quality, setQuality] = useState((initialInputs?.quality as string) ?? "balanced");
  const [effort, setEffort] = useState((initialInputs?.effort as string) ?? "");
  const t = T[useLocale()];

  const { loading, error, assets, creditsUsed, run } = useGeneration("social-pack", {
    errorLabel: t.genError,
  });

  async function submit(mode: "manual" | "auto") {
    const g = await run(
      {
        topic, platform, postCount, tone, variantsPerPost, format, captionLength,
        hashtagCount, language, includeCta, useEmoji, includeImage, refine, quality,
        ...(effort ? { effort } : {}),
      },
      mode,
    );
    if (g) setRefine("");
  }

  const hasAssets = assets.length > 0;
  const isEmpty = !loading && !error && !hasAssets && creditsUsed == null;

  return (
    <RunnerLayout
      controls={
        <div className="space-y-4">
          <Field label={t.topic}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topicPlaceholder}
              className="field"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t.platform}>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="field">
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
              </select>
            </Field>

            <Field label={t.format}>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="field">
                {FORMAT_KEYS.map((f) => (
                  <option key={f} value={f}>
                    {t.formats[f]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t.postCount}>
              <input
                type="number"
                min={1}
                max={10}
                value={postCount}
                onChange={(e) => setPostCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="field"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t.tone}>
              <input value={tone} onChange={(e) => setTone(e.target.value)} className="field" />
            </Field>

            <Field label={t.captionLength}>
              <select
                value={captionLength}
                onChange={(e) => setCaptionLength(e.target.value)}
                className="field"
              >
                {LENGTH_KEYS.map((l) => (
                  <option key={l} value={l}>
                    {t.lengths[l]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t.language}>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="field">
                <option value="sr">SR</option>
                <option value="en">EN</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t.hashtagCount}>
              <input
                type="number"
                min={0}
                max={15}
                value={hashtagCount}
                onChange={(e) => setHashtagCount(Math.max(0, Math.min(15, Number(e.target.value) || 0)))}
                className="field"
              />
            </Field>

            <Field label={t.variantsPerPost}>
              <input
                type="number"
                min={1}
                max={3}
                value={variantsPerPost}
                onChange={(e) => setVariantsPerPost(Math.max(1, Math.min(3, Number(e.target.value) || 1)))}
                className="field"
                disabled={!includeImage}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={includeImage} onChange={(e) => setIncludeImage(e.target.checked)} />
              {t.includeImage}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={includeCta} onChange={(e) => setIncludeCta(e.target.checked)} />
              {t.includeCta}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={useEmoji} onChange={(e) => setUseEmoji(e.target.checked)} />
              {t.useEmoji}
            </label>
          </div>

          <AiAdvanced quality={quality} onQuality={setQuality} effort={effort} onEffort={setEffort} />

          <RunButton
            onClick={() => submit("manual")}
            disabled={loading || topic.length < 2}
            loading={loading}
            loadingLabel={t.generating}
            cost={
              <CostHint
                credits={estimateModuleCredits("social-pack", {
                  postCount,
                  variantsPerPost,
                  includeImage,
                })}
                note={supportsAuto ? t.autoNote : undefined}
              />
            }
          >
            {t.make}
          </RunButton>

          {supportsAuto && (
            <Button
              variant="secondary"
              onClick={() => submit("auto")}
              disabled={loading || topic.length < 2}
              title={t.autoTitle}
              className="w-full gap-1.5"
            >
              <Zap className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              {t.auto}
            </Button>
          )}
        </div>
      }
      output={
        <OutputPanel title={t.outputTitle} isEmpty={isEmpty} emptyLabel={t.emptyLabel}>
          {error && <RunnerError>{error}</RunnerError>}

          {creditsUsed != null && <CreditsReceipt label={t.creditsUsed} used={creditsUsed} />}

          {hasAssets && (
            <div className="flex items-center justify-between rounded-lg border border-violet-400/20 bg-violet-500/10 px-4 py-3">
              <span className="text-sm text-violet-200">{t.readyToPublish}</span>
              <Link
                href={`/studio/calendar?platform=${encodeURIComponent(platform)}&caption=${encodeURIComponent(
                  assets.find((a) => a.kind === "text")?.text ?? "",
                )}${
                  assets.find((a) => a.kind === "image")?.url
                    ? `&mediaUrl=${encodeURIComponent(assets.find((a) => a.kind === "image")!.url!)}`
                    : ""
                }`}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                {t.scheduleInCalendar}
              </Link>
            </div>
          )}

          {hasAssets && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {assets.map((a, i) =>
                a.kind === "image" && a.url ? (
                  <div key={i} className="overflow-hidden rounded-xl border border-white/10">
                    {/* Provider URLs are arbitrary hosts; use a plain img to avoid next/image domain config. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={t.generatedImage(i)} className="w-full" />
                  </div>
                ) : a.kind === "text" && a.text ? (
                  <div key={i} className="whitespace-pre-wrap surface p-4 text-sm text-zinc-200">
                    {a.text}
                  </div>
                ) : null,
              )}
            </div>
          )}

          {hasAssets && (
            <RefineBar
              value={refine}
              onChange={setRefine}
              onSubmit={() => submit("manual")}
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
