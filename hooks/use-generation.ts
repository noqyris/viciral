"use client";

import { useState } from "react";
import { notifyCreditsChanged } from "@/components/credits-context";
import type { GenerationAsset, GenerationResult, GenerationResponse } from "@/components/runner-types";

/**
 * Shared client logic for SYNC (inline) generation runners. Submits to
 * /api/generate and settles the result in one place: loading/error state, the
 * POST + not-ok→throw, credit-badge refresh, and the returned generation.
 * Callers derive their specific output (images/html/audio) from `assets` and own
 * any form resets. Async (queued) runners use useAsyncGeneration instead.
 */
export function useGeneration(moduleSlug: string, opts?: { errorLabel?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);

  async function run(inputs: unknown, mode: "manual" | "auto" = "manual"): Promise<GenerationResult | null> {
    setLoading(true);
    setError(null);
    setGeneration(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleSlug, mode, inputs }),
      });
      const data = (await res.json()) as GenerationResponse;
      if (!res.ok) throw new Error(data.error ?? opts?.errorLabel ?? "Greška pri generisanju");
      const gen = data.generation ?? null;
      setGeneration(gen);
      notifyCreditsChanged();
      return gen;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const assets: GenerationAsset[] = generation?.assets ?? [];
  const creditsUsed = generation?.creditsUsed ?? null;
  return { loading, error, generation, assets, creditsUsed, run };
}
