"use client";

import { useEffect, useState } from "react";
import { notifyCreditsChanged } from "@/components/credits-context";
import type { AsyncGeneration } from "@/components/runner-types";

/**
 * Shared client logic for async (queued) modules — cinematic, avatar, dubbing.
 * Submits to /api/generate, then polls /api/generations/[id] every 4s while
 * PENDING/RUNNING and refreshes the credit badge on submit + terminal status.
 * Each runner keeps its own form and passes its inputs to `submit`.
 */
export function useAsyncGeneration(moduleSlug: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<AsyncGeneration | null>(null);

  const genId = generation?.id;
  const genStatus = generation?.status;

  useEffect(() => {
    if (!genId || (genStatus !== "PENDING" && genStatus !== "RUNNING")) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generations/${genId}`);
        const data = (await res.json()) as { generation?: AsyncGeneration };
        if (data.generation) {
          setGeneration(data.generation);
          if (data.generation.status === "COMPLETED" || data.generation.status === "FAILED") {
            notifyCreditsChanged();
          }
        }
      } catch {
        // transient; keep polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [genId, genStatus]);

  async function submit(inputs: unknown) {
    setSubmitting(true);
    setError(null);
    setGeneration(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleSlug, mode: "manual", inputs }),
      });
      const data = (await res.json()) as { generation?: AsyncGeneration; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Greška pri pokretanju");
      if (data.generation) setGeneration(data.generation);
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const processing = genStatus === "PENDING" || genStatus === "RUNNING";
  const video = generation?.assets.find((a) => a.kind === "video");
  return { generation, submitting, error, processing, video, submit };
}
