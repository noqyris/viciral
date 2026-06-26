"use client";

import type { ReactNode } from "react";
import { Loader2, Sparkles, Wand2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared "pro studio" building blocks used by every module runner so they all
 * read as one polished product: a two-panel layout (controls · live output),
 * a framed output canvas with an empty state, a prominent run button with the
 * credit cost, and consistent error / note / loading blocks.
 */

/** Two-panel layout: controls (left) · output canvas (right). Stacks on mobile. */
export function RunnerLayout({
  controls,
  output,
}: {
  controls: ReactNode;
  output: ReactNode;
}) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="card card-frost rounded-2xl p-5 sm:p-6">{controls}</section>
      <section className="lg:sticky lg:top-6">{output}</section>
    </div>
  );
}

/** A labeled control group inside the controls panel (used for section headers). */
export function ControlGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {title ? (
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{title}</p>
      ) : null}
      {children}
    </div>
  );
}

/** Labeled field wrapper (keeps the existing `.field` inputs). */
export function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center justify-between gap-2">
        <span className="field-label">{label}</span>
        {hint ? <span className="text-[11px] text-zinc-500">{hint}</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/** Prominent run button + the credit-cost line beneath it. */
export function RunButton({
  onClick,
  disabled,
  loading,
  loadingLabel,
  cost,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  cost?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 pt-1">
      <Button onClick={onClick} disabled={disabled} className="w-full gap-2">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {loadingLabel ?? children}
          </>
        ) : (
          <>
            <Sparkles className="size-4" aria-hidden />
            {children}
          </>
        )}
      </Button>
      {cost}
    </div>
  );
}

/** The output canvas — a framed panel with a title and an empty placeholder. */
export function OutputPanel({
  title,
  hint,
  isEmpty,
  emptyLabel,
  emptyIcon,
  children,
}: {
  title: string;
  hint?: string;
  isEmpty?: boolean;
  emptyLabel?: string;
  emptyIcon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="card card-frost flex min-h-[24rem] flex-col rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">{title}</span>
        {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      </div>
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-white/[0.04] text-zinc-500 ring-1 ring-inset ring-white/10">
            {emptyIcon ?? <Wand2 className="size-5" strokeWidth={1.75} aria-hidden />}
          </span>
          <p className="max-w-[24ch] text-sm leading-relaxed text-zinc-500">{emptyLabel}</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3">{children}</div>
      )}
    </div>
  );
}

/** Centered loading state for the output panel (e.g. async generation). */
export function RunnerLoading({ label }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <Loader2 className="size-6 animate-spin text-violet-300" aria-hidden />
      <p className="max-w-[28ch] text-sm leading-relaxed text-zinc-400">{label}</p>
    </div>
  );
}

/** Consistent inline error block. */
export function RunnerError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
      {children}
    </div>
  );
}

/** Info / progress note (violet by default, amber for "this takes a while"). */
export function RunnerNote({
  tone = "info",
  children,
}: {
  tone?: "info" | "amber";
  children: ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-violet-400/20 bg-violet-500/10 text-violet-200";
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm leading-relaxed ${cls}`}>
      {tone === "amber" ? (
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      <span>{children}</span>
    </div>
  );
}

/** "Credits used: N" receipt line shown after a run. */
export function CreditsReceipt({ label, used }: { label: string; used: number }) {
  return (
    <p className="mono text-xs text-zinc-500">
      {label} <span className="text-zinc-300">{used}</span>
    </p>
  );
}

/** Download / open-in-new-tab action link for a result asset. */
export function AssetAction({
  href,
  children,
  download,
}: {
  href: string;
  children: ReactNode;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
    >
      {download ? <Download className="size-4" aria-hidden /> : <ExternalLink className="size-4" aria-hidden />}
      {children}
    </a>
  );
}
