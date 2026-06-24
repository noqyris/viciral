"use client";

import { useEffect, useRef, useState } from "react";
import { notifyCreditsChanged } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import type { AsyncGeneration } from "@/components/runner-types";

const T = {
  sr: {
    timeout:
      "Obrada predugo traje. Krediti za neuspele poslove se vraćaju automatski — osveži stranicu kasnije.",
    startError: "Greška pri pokretanju",
    notStarted: "Zadatak nije pokrenut — pokušaj ponovo.",
  },
  en: {
    timeout:
      "Processing is taking too long. Credits for failed jobs are refunded automatically — refresh the page later.",
    startError: "Failed to start",
    notStarted: "The job didn't start — try again.",
  },
} as const;

/**
 * Shared client logic for async (queued) modules — cinematic, avatar, dubbing.
 * Submits to /api/generate, then polls /api/generations/[id] every 4s while
 * PENDING/RUNNING and refreshes the credit badge on submit + terminal status.
 * Each runner keeps its own form and passes its inputs to `submit`.
 */

// Stop polling after ~15 min (4s interval) so a dropped webhook or a stalled job
// can't keep the UI spinning forever. The server-side reaper refunds the held
// reservation independently, so giving up here is purely a UI concern.
const MAX_POLLS = 225;

export function useAsyncGeneration(moduleSlug: string) {
  const t = T[useLocale()];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<AsyncGeneration | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollCount = useRef(0);

  const genId = generation?.id;
  const genStatus = generation?.status;

  useEffect(() => {
    if (timedOut) return;
    if (!genId || (genStatus !== "PENDING" && genStatus !== "RUNNING")) return;
    // `cancelled` guards against a fetch that resolves after this poll was torn
    // down (e.g. the user re-submitted): clearInterval stops future ticks but
    // can't abort an in-flight request, and applying its result would resurrect
    // the previous job's state. The id check is a second belt-and-braces guard.
    let cancelled = false;
    const interval = setInterval(async () => {
      if (pollCount.current >= MAX_POLLS) {
        clearInterval(interval);
        if (!cancelled) {
          setTimedOut(true);
          setError(t.timeout);
        }
        return;
      }
      pollCount.current += 1;
      try {
        const res = await fetch(`/api/generations/${genId}`);
        if (!res.ok) return; // transient HTTP error; keep polling (counts toward the cap)
        const data = (await res.json()) as { generation?: AsyncGeneration };
        if (cancelled || data.generation?.id !== genId) return; // stale response
        setGeneration(data.generation);
        if (data.generation.status === "COMPLETED" || data.generation.status === "FAILED") {
          notifyCreditsChanged();
        }
      } catch {
        // transient; keep polling
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [genId, genStatus, timedOut, t.timeout]);

  async function submit(inputs: unknown) {
    setSubmitting(true);
    setError(null);
    setGeneration(null);
    setTimedOut(false);
    pollCount.current = 0;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleSlug, mode: "manual", inputs }),
      });
      const data = (await res.json()) as { generation?: AsyncGeneration; error?: string };
      if (!res.ok) throw new Error(data.error ?? t.startError);
      if (!data.generation) throw new Error(t.notStarted);
      setGeneration(data.generation);
      notifyCreditsChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const processing = !timedOut && (genStatus === "PENDING" || genStatus === "RUNNING");
  const video = generation?.assets.find((a) => a.kind === "video");
  return { generation, submitting, error, processing, video, submit };
}
