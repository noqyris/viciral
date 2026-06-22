"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      if (!res.ok) throw new Error(data.error ?? "Greška pri generisanju");
      setAssets(data.generation?.assets ?? []);
      setCreditsUsed(data.generation?.creditsUsed ?? null);
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
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Naziv brenda"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Čime se brend bavi, kome se obraća…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="Stil / vajb (npr. moderno, toplo, minimalistički)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            onClick={() => run("manual")}
            disabled={loading || brandName.length < 2 || description.length < 2}
          >
            {loading ? "Pravim…" : "Napravi brend"}
          </Button>
          {supportsAuto && (
            <Button
              variant="secondary"
              onClick={() => run("auto")}
              disabled={loading || brandName.length < 2 || description.length < 2}
              title="Jača orkestracija (Opus) za bolji identitet"
            >
              ⚡ Auto (Opus)
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {assets && (
        <div className="space-y-5">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            ✓ Brend je sačuvan u memoriju — izaberi ga u{" "}
            <Link href="/studio/brand" className="underline">
              Brendovima
            </Link>{" "}
            ili direktno u Social / Cinematic modulu.
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {logo?.url && (
              <figure className="overflow-hidden rounded-xl border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.url} alt="Logo" className="w-full" />
                <figcaption className="p-2 text-center text-xs text-zinc-500">Logo</figcaption>
              </figure>
            )}
            {avatar?.url && (
              <figure className="overflow-hidden rounded-xl border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar.url} alt="Avatar" className="w-full" />
                <figcaption className="p-2 text-center text-xs text-zinc-500">Avatar</figcaption>
              </figure>
            )}
          </div>

          {palette.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {palette.map((c) => (
                <div key={c} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1">
                  <span
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: c }}
                    aria-hidden
                  />
                  <span className="text-xs text-zinc-600">{c}</span>
                </div>
              ))}
            </div>
          )}

          {summary?.text && (
            <div className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800">
              {summary.text}
            </div>
          )}

          {creditsUsed != null && (
            <div className="text-sm text-zinc-500">Potrošeno kredita: {creditsUsed}</div>
          )}
        </div>
      )}
    </div>
  );
}
