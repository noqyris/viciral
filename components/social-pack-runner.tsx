"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Asset {
  kind: "image" | "video" | "text";
  url?: string;
  text?: string;
}

interface GenerationResponse {
  generation?: { creditsUsed?: number; assets?: Asset[] };
  error?: string;
}

export function SocialPackRunner({ supportsAuto }: { supportsAuto: boolean }) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [postCount, setPostCount] = useState(3);
  const [tone, setTone] = useState("prijateljski");

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
          moduleSlug: "social-pack",
          mode,
          inputs: { topic, platform, postCount, tone },
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

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Tema</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="npr. lansiranje nove kolekcije patika"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Platforma</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Broj objava</span>
            <input
              type="number"
              min={1}
              max={10}
              value={postCount}
              onChange={(e) => setPostCount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Ton</span>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={() => run("manual")} disabled={loading || topic.length < 2}>
            {loading ? "Generišem…" : "Napravi"}
          </Button>
          {supportsAuto && (
            <Button
              variant="secondary"
              onClick={() => run("auto")}
              disabled={loading || topic.length < 2}
              title="Pusti AI da odradi sve (jača orkestracija)"
            >
              ⚡ Auto režim
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {creditsUsed != null && (
        <div className="text-sm text-zinc-500">Potrošeno kredita: {creditsUsed}</div>
      )}

      {assets && assets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((a, i) =>
            a.kind === "image" && a.url ? (
              <div key={i} className="overflow-hidden rounded-xl border border-zinc-200">
                {/* Provider URLs are arbitrary hosts; use a plain img to avoid next/image domain config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={`Generisana slika ${i}`} className="w-full" />
              </div>
            ) : a.kind === "text" && a.text ? (
              <div
                key={i}
                className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-800"
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
