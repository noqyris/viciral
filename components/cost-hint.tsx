"use client";

import { useCredits } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";

const T = {
  sr: {
    estimate: "Procena:",
    creditsValue: (credits: number) => `≈ ${credits} kredita`,
    insufficient: "— možda nemaš dovoljno kredita",
  },
  en: {
    estimate: "Estimate:",
    creditsValue: (credits: number) => `≈ ${credits} credits`,
    insufficient: "— you may not have enough credits",
  },
} as const;

/**
 * Shows the estimated credit cost of a run before the user commits, and warns
 * softly if their balance looks too low. The warning is advisory only — the
 * server is the source of truth and enforces the real charge.
 */
export function CostHint({ credits, note }: { credits: number; note?: string }) {
  const { balance } = useCredits();
  const t = T[useLocale()];
  const insufficient = balance != null && credits > balance;

  return (
    <p className="text-xs text-zinc-400">
      {t.estimate}{" "}
      <span className="font-medium text-zinc-300">{t.creditsValue(credits)}</span>
      {note ? <span className="text-zinc-400"> · {note}</span> : null}
      {insufficient && (
        <span className="ml-1 text-amber-600">{t.insufficient}</span>
      )}
    </p>
  );
}
