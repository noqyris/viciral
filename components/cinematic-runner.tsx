"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Asset {
  id: string;
  kind: "image" | "video" | "text";
  url?: string | null;
  jobStatus?: string | null;
}

interface Generation {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  error?: string | null;
  assets: Asset[];
}

export function CinematicRunner() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [durationSec, setDurationSec] = useState<5 | 10>(5);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);

  const genId = generation?.id;
  const genStatus = generation?.status;

  // Poll while pending/running. Depends on id+status only, so a fresh status
  // object each tick doesn't tear down and re-arm the interval.
  useEffect(() => {
    if (!genId || (genStatus !== "PENDING" && genStatus !== "RUNNING")) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generations/${genId}`);
        const data = (await res.json()) as { generation?: Generation };
        if (data.generation) setGeneration(data.generation);
      } catch {
        // transient; keep polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [genId, genStatus]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    setGeneration(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "cinematic",
          mode: "manual",
          inputs: { prompt, imageUrl, durationSec },
        }),
      });
      const data = (await res.json()) as { generation?: Generation; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Greška pri pokretanju");
      if (data.generation) setGeneration(data.generation);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const video = generation?.assets.find((a) => a.kind === "video");
  const processing =
    generation?.status === "PENDING" || generation?.status === "RUNNING";

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Polazna slika (URL)</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…/slika.png"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Opis pokreta / scene</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="npr. spori zoom na proizvod, topla svetlost, kinematski"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Trajanje</span>
          <select
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value) === 10 ? 10 : 5)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
          >
            <option value={5}>5 sekundi</option>
            <option value={10}>10 sekundi</option>
          </select>
        </label>

        <Button
          onClick={submit}
          disabled={submitting || processing || prompt.length < 2 || imageUrl.length < 4}
        >
          {submitting ? "Pokrećem…" : "Napravi video"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {processing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Video se generiše… ovo može potrajati minut-dva. Status se osvežava sam.
        </div>
      )}

      {generation?.status === "FAILED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {generation.error ?? "Generisanje nije uspelo."}
        </div>
      )}

      {video?.url && (
        <video
          src={video.url}
          controls
          className="w-full rounded-xl border border-zinc-200"
        />
      )}
    </div>
  );
}
