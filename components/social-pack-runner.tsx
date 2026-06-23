"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";

const T = {
  sr: {
    genError: "Greška pri generisanju",
    topic: "Tema",
    topicPlaceholder: "npr. lansiranje nove kolekcije patika",
    platform: "Platforma",
    postCount: "Broj objava",
    tone: "Ton",
    variantsPerPost: "Varijanti po objavi",
    brand: "Brend",
    noBrand: "Bez brenda",
    defaultSuffix: " (podrazumevani)",
    generating: "Generišem…",
    make: "Napravi",
    auto: "⚡ Auto",
    autoTitle: "Pusti AI (Opus) da odradi ceo proces umesto tebe",
    autoNote: "Auto: AI vodi ceo proces",
    creditsUsed: "Potrošeno kredita:",
    readyToPublish: "Spremno za objavu?",
    scheduleInCalendar: "Zakaži u kalendaru →",
    generatedImage: (i: number) => `Generisana slika ${i}`,
  },
  en: {
    genError: "Generation failed",
    topic: "Topic",
    topicPlaceholder: "e.g. launching a new sneaker collection",
    platform: "Platform",
    postCount: "Number of posts",
    tone: "Tone",
    variantsPerPost: "Variants per post",
    brand: "Brand",
    noBrand: "No brand",
    defaultSuffix: " (default)",
    generating: "Generating…",
    make: "Create",
    auto: "⚡ Auto",
    autoTitle: "Let the AI (Opus) run the whole process for you",
    autoNote: "Auto: AI runs the whole process",
    creditsUsed: "Credits used:",
    readyToPublish: "Ready to publish?",
    scheduleInCalendar: "Schedule in calendar →",
    generatedImage: (i: number) => `Generated image ${i}`,
  },
} as const;

interface Asset {
  kind: "image" | "video" | "text";
  url?: string;
  text?: string;
}

interface BrandOption {
  id: string;
  name: string;
  isDefault: boolean;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

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
  const t = T[useLocale()];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandId, setBrandId] = useState<string>("");

  useEffect(() => {
    let active = true;
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data: { brands?: BrandOption[] }) => {
        if (!active) return;
        const list = data.brands ?? [];
        setBrands(list);
        const def = list.find((b) => b.isDefault);
        if (def) setBrandId(def.id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function run(mode: "manual" | "auto") {
    setLoading(true);
    setError(null);
    setAssets(null);
    setCreditsUsed(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "social-pack",
          mode,
          inputs: { topic, platform, postCount, tone, variantsPerPost },
          brandId: brandId || undefined,
        }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? t.genError);
      setAssets(data.generation?.assets ?? []);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 surface p-5">
        <label className="block">
          <span className="field-label">{t.topic}</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.topicPlaceholder}
            className="mt-1 field"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">{t.platform}</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 field"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">{t.postCount}</span>
            <input
              type="number"
              min={1}
              max={10}
              value={postCount}
              onChange={(e) => setPostCount(Number(e.target.value))}
              className="mt-1 field"
            />
          </label>

          <label className="block">
            <span className="field-label">{t.tone}</span>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 field"
            />
          </label>
        </div>

        <label className="block sm:max-w-[12rem]">
          <span className="field-label">{t.variantsPerPost}</span>
          <input
            type="number"
            min={1}
            max={3}
            value={variantsPerPost}
            onChange={(e) => setVariantsPerPost(Number(e.target.value))}
            className="mt-1 field"
          />
        </label>

        {brands.length > 0 && (
          <label className="block">
            <span className="field-label">{t.brand}</span>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="mt-1 field"
            >
              <option value="">{t.noBrand}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.isDefault ? t.defaultSuffix : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => run("manual")} disabled={loading || topic.length < 2}>
              {loading ? t.generating : t.make}
            </Button>
            {supportsAuto && (
              <Button
                variant="secondary"
                onClick={() => run("auto")}
                disabled={loading || topic.length < 2}
                title={t.autoTitle}
              >
                {t.auto}
              </Button>
            )}
          </div>
          <CostHint
            credits={estimateModuleCredits("social-pack", { postCount, variantsPerPost })}
            note={supportsAuto ? t.autoNote : undefined}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {creditsUsed != null && (
        <div className="text-sm text-zinc-400">{t.creditsUsed} {creditsUsed}</div>
      )}

      {assets && assets.length > 0 && (
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

      {assets && assets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((a, i) =>
            a.kind === "image" && a.url ? (
              <div key={i} className="overflow-hidden rounded-xl border border-white/10">
                {/* Provider URLs are arbitrary hosts; use a plain img to avoid next/image domain config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={t.generatedImage(i)} className="w-full" />
              </div>
            ) : a.kind === "text" && a.text ? (
              <div
                key={i}
                className="whitespace-pre-wrap surface p-4 text-sm text-zinc-200"
              >
                {a.text}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
