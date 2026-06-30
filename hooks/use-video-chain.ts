"use client";

import { useRef, useState } from "react";
import { notifyCreditsChanged } from "@/components/credits-context";
import type { AsyncGeneration } from "@/components/runner-types";

/**
 * Client orchestrator for arbitrary-length video. Seedance caps a clip at ~15s,
 * so a longer video is built by CHAINING: generate clip → extract its last frame
 * → use that frame to start the next clip → … → merge all clips into one.
 *
 * Each clip is a normal (already-tested) async `cinematic` generation that bills
 * itself via the existing webhook settlement — so the chain adds no new billing
 * state. Extraction + merge go through small auth-gated, charged utility routes.
 * (Runs in the browser, so the tab must stay open until the chain finishes.)
 */

const POLL_MS = 4000;
const MAX_POLLS_PER_SEGMENT = 225; // ~15 min per clip before giving up

export type ChainPhase = "idle" | "frame" | "segment" | "extract" | "merge" | "done" | "error";

export interface ChainConfig {
  mode: "text" | "image";
  /** Scene/motion description — also the first-frame subject in text mode. */
  prompt: string;
  startImageUrl?: string;
  aspect: string;
  segments: number;
  segmentSec: number;
  withAudio: boolean;
  useBrand: boolean;
  resolution: string;
  bitrateMode: string;
  videoModel: string;
}

interface GenResp {
  generation?: AsyncGeneration;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function startGen(moduleSlug: string, inputs: unknown): Promise<AsyncGeneration> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ moduleSlug, mode: "manual", inputs }),
  });
  const data = (await res.json()) as GenResp;
  if (!res.ok || !data.generation) throw new Error(data.error ?? "Pokretanje nije uspelo.");
  return data.generation;
}

async function pollGen(id: string): Promise<AsyncGeneration> {
  for (let i = 0; i < MAX_POLLS_PER_SEGMENT; i++) {
    await sleep(POLL_MS);
    const res = await fetch(`/api/generations/${id}`);
    if (!res.ok) continue; // transient — keep polling
    const data = (await res.json()) as GenResp;
    const g = data.generation;
    if (g && (g.status === "COMPLETED" || g.status === "FAILED")) return g;
  }
  throw new Error("Obrada predugo traje. Pokušaj ponovo.");
}

const videoUrlOf = (g: AsyncGeneration) => g.assets.find((a) => a.kind === "video")?.url ?? undefined;
const imageUrlOf = (g: AsyncGeneration) => g.assets.find((a) => a.kind === "image")?.url ?? undefined;

export function useVideoChain() {
  const [phase, setPhase] = useState<ChainPhase>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [clips, setClips] = useState<string[]>([]);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const running = phase === "frame" || phase === "segment" || phase === "extract" || phase === "merge";

  async function run(cfg: ChainConfig) {
    if (runningRef.current) return;
    runningRef.current = true;
    setError(null);
    setClips([]);
    setFinalUrl(null);
    setSegmentIndex(0);
    const collected: string[] = [];

    try {
      // 1. First frame — a user image, or an on-brand frame generated from text.
      let frameUrl = cfg.mode === "image" ? cfg.startImageUrl?.trim() : undefined;
      if (cfg.mode === "text") {
        setPhase("frame");
        const g = await startGen("image", {
          prompt: cfg.prompt,
          aspectRatio: cfg.aspect,
          variants: 1,
          style: "cinematic",
          useBrand: cfg.useBrand,
          enhancePrompt: false,
        });
        frameUrl = imageUrlOf(g);
        notifyCreditsChanged();
      }
      if (!frameUrl) throw new Error("Nema početnog frejma.");

      // 2. Generate each clip, chaining the last frame forward.
      for (let k = 0; k < cfg.segments; k++) {
        setSegmentIndex(k);
        setPhase("segment");
        const started = await startGen("cinematic", {
          prompt: cfg.prompt,
          imageUrl: frameUrl,
          durationSec: cfg.segmentSec,
          aspectRatio: cfg.aspect,
          withAudio: cfg.withAudio,
          resolution: cfg.resolution,
          bitrateMode: cfg.bitrateMode,
          videoModel: cfg.videoModel,
        });
        notifyCreditsChanged();
        const done = started.status === "COMPLETED" ? started : await pollGen(started.id);
        if (done.status !== "COMPLETED") throw new Error(done.error ?? "Segment nije uspeo.");
        const clipUrl = videoUrlOf(done);
        if (!clipUrl) throw new Error("Segment je gotov ali nema videa.");
        collected.push(clipUrl);
        setClips([...collected]);

        // Seed the next clip from this one's last frame (skip after the last).
        if (k < cfg.segments - 1) {
          setPhase("extract");
          const res = await fetch("/api/video/extract-frame", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ videoUrl: clipUrl }),
          });
          const data = (await res.json()) as { frameUrl?: string; error?: string };
          if (!res.ok || !data.frameUrl) throw new Error(data.error ?? "Izvlačenje frejma nije uspelo.");
          frameUrl = data.frameUrl;
          notifyCreditsChanged();
        }
      }

      // 3. Merge the clips into one video (only when there's more than one).
      let final = collected[0];
      if (collected.length > 1) {
        setPhase("merge");
        const res = await fetch("/api/video/merge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ videoUrls: collected, totalSec: cfg.segments * cfg.segmentSec }),
        });
        const data = (await res.json()) as { finalUrl?: string; error?: string };
        if (!res.ok || !data.finalUrl) throw new Error(data.error ?? "Spajanje nije uspelo.");
        final = data.finalUrl;
        notifyCreditsChanged();
      }

      setFinalUrl(final);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    } finally {
      runningRef.current = false;
    }
  }

  return { phase, segmentIndex, clips, finalUrl, error, running, run };
}
