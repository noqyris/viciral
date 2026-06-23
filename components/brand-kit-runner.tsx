"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CostHint } from "@/components/cost-hint";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { estimateModuleCredits } from "@/lib/credits/estimate";

const T = {
  sr: {
    genError: "Greška pri generisanju",
    brandName: "Naziv brenda",
    brandNamePlaceholder: "npr. Lunar Coffee",
    description: "Opis",
    descriptionPlaceholder: "Čime se brend bavi, kome se obraća…",
    style: "Stil / vajb",
    stylePlaceholder: "npr. moderno, toplo, minimalistički",
    building: "Pravim…",
    makeBrand: "Napravi brend",
    auto: "⚡ Auto",
    autoTitle: "Pusti AI (Opus) da odradi ceo proces umesto tebe",
    costNote: "logo + avatar + identitet",
    savedPrefix: "✓ Brend je sačuvan u memoriju — izaberi ga u",
    brandsLink: "Brendovima",
    savedSuffix: "ili direktno u Social / Cinematic modulu.",
    logo: "Logo",
    avatar: "Avatar",
    creditsUsed: "Potrošeno kredita:",
  },
  en: {
    genError: "Generation failed",
    brandName: "Brand name",
    brandNamePlaceholder: "e.g. Lunar Coffee",
    description: "Description",
    descriptionPlaceholder: "What the brand does, who it speaks to…",
    style: "Style / vibe",
    stylePlaceholder: "e.g. modern, warm, minimalist",
    building: "Creating…",
    makeBrand: "Create brand",
    auto: "⚡ Auto",
    autoTitle: "Let the AI (Opus) run the whole process for you",
    costNote: "logo + avatar + identity",
    savedPrefix: "✓ Brand saved to memory — pick it in",
    brandsLink: "Brands",
    savedSuffix: "or directly in the Social / Cinematic module.",
    logo: "Logo",
    avatar: "Avatar",
    creditsUsed: "Credits used:",
  },
} as const;

interface Asset {
  id: string;
  kind: "image" | "video" | "text";
  url?: string | null;
  text?: string | null;
  meta?: { role?: string; palette?: string[] } | null;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function BrandKitRunner({ supportsAuto }: { supportsAuto: boolean }) {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [vibe, setVibe] = useState("");
  const t = T[useLocale()];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

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
          moduleSlug: "brand-kit",
          mode,
          inputs: { brandName, description, vibe },
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

  const logo = assets?.find((a) => a.kind === "image" && a.meta?.role === "logo");
  const avatar = assets?.find((a) => a.kind === "image" && a.meta?.role === "avatar");
  const summary = assets?.find((a) => a.kind === "text");
  const palette = summary?.meta?.palette ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-4 surface p-5">
        <label className="block">
          <span className="field-label">{t.brandName}</span>
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={t.brandNamePlaceholder}
            className="mt-1 field"
          />
        </label>
        <label className="block">
          <span className="field-label">{t.description}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t.descriptionPlaceholder}
            className="mt-1 field"
          />
        </label>
        <label className="block">
          <span className="field-label">{t.style}</span>
          <input
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder={t.stylePlaceholder}
            className="mt-1 field"
          />
        </label>
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => run("manual")}
              disabled={loading || brandName.length < 2 || description.length < 2}
            >
              {loading ? t.building : t.makeBrand}
            </Button>
            {supportsAuto && (
              <Button
                variant="secondary"
                onClick={() => run("auto")}
                disabled={loading || brandName.length < 2 || description.length < 2}
                title={t.autoTitle}
              >
                {t.auto}
              </Button>
            )}
          </div>
          <CostHint
            credits={estimateModuleCredits("brand-kit")}
            note={t.costNote}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {assets && (
        <div className="space-y-5">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {t.savedPrefix}{" "}
            <Link href="/studio/brand" className="underline">
              {t.brandsLink}
            </Link>{" "}
            {t.savedSuffix}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {logo?.url && (
              <figure className="overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.url} alt={t.logo} className="w-full" />
                <figcaption className="p-2 text-center text-xs text-zinc-400">{t.logo}</figcaption>
              </figure>
            )}
            {avatar?.url && (
              <figure className="overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar.url} alt={t.avatar} className="w-full" />
                <figcaption className="p-2 text-center text-xs text-zinc-400">{t.avatar}</figcaption>
              </figure>
            )}
          </div>

          {palette.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {palette.map((c) => (
                <div key={c} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1">
                  <span
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: c }}
                    aria-hidden
                  />
                  <span className="text-xs text-zinc-400">{c}</span>
                </div>
              ))}
            </div>
          )}

          {summary?.text && (
            <div className="whitespace-pre-wrap surface p-4 text-sm text-zinc-200">
              {summary.text}
            </div>
          )}

          {creditsUsed != null && (
            <div className="text-sm text-zinc-400">{t.creditsUsed} {creditsUsed}</div>
          )}
        </div>
      )}
    </div>
  );
}
