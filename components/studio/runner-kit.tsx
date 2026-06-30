"use client";

import type { ReactNode } from "react";
import { Loader2, Sparkles, Wand2, Download, ExternalLink, RefreshCw, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-context";

/**
 * Shared "pro studio" building blocks used by every module runner so they all
 * read as one polished product: a generous two-panel layout (inputs left · live
 * result right), a large framed output canvas with an empty state, a prominent
 * run button with the credit cost, a refine bar to iterate on a result, and
 * consistent error / note / loading blocks.
 */

/**
 * The studio workspace — ONE cohesive surface split into a controls rail (left)
 * and a large result canvas (right), divided by a hairline (not two floating
 * cards). Fills the height so it reads as a pro tool, not two small modals.
 * Stacks vertically on mobile.
 */
export function RunnerLayout({
  controls,
  output,
}: {
  controls: ReactNode;
  output: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.018] shadow-[0_50px_140px_-70px_rgba(99,102,241,0.55)] backdrop-blur-sm lg:grid lg:min-h-[42rem] lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)]">
      <section className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
        {controls}
      </section>
      <section className="bg-[#06060b]/55 p-4 sm:p-5">{output}</section>
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

/**
 * Collapsible "Advanced" disclosure — every runner puts power-user controls
 * (the full API surface) here so the Basic controls stay uncluttered. Closed by
 * default.
 */
export function AdvancedSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-white/10 bg-white/[0.02]">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-zinc-500" aria-hidden />
          {title}
        </span>
        <ChevronDown className="size-4 text-zinc-500 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

const AI_T = {
  sr: { advanced: "Napredno (AI)", quality: "Kvalitet modela", effort: "Dubina razmišljanja", auto: "Automatski", fast: "Brzo (Haiku)", balanced: "Uravnoteženo (Sonnet)", best: "Najbolje (Opus)" },
  en: { advanced: "Advanced (AI)", quality: "Model quality", effort: "Reasoning depth", auto: "Auto", fast: "Fast (Haiku)", balanced: "Balanced (Sonnet)", best: "Best (Opus)" },
} as const;
const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

/**
 * Shared "Advanced (AI)" block for text-driven modules — the Claude quality
 * preset (Fast/Balanced/Best → Haiku/Sonnet/Opus) and reasoning effort. `extra`
 * renders additional advanced controls inside the same disclosure. `effort` is
 * a string ("" = Auto → the module omits it).
 */
export function AiAdvanced({
  quality,
  onQuality,
  effort,
  onEffort,
  extra,
}: {
  quality: string;
  onQuality: (v: string) => void;
  effort: string;
  onEffort: (v: string) => void;
  extra?: ReactNode;
}) {
  const t = AI_T[useLocale()];
  return (
    <AdvancedSection title={t.advanced}>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t.quality}>
          <select value={quality} onChange={(e) => onQuality(e.target.value)} className="field">
            <option value="fast">{t.fast}</option>
            <option value="balanced">{t.balanced}</option>
            <option value="best">{t.best}</option>
          </select>
        </Field>
        <Field label={t.effort}>
          <select value={effort} onChange={(e) => onEffort(e.target.value)} className="field">
            <option value="">{t.auto}</option>
            {EFFORTS.map((e) => (
              <option key={e} value={e}>
                {e === "xhigh" ? "X-High" : e[0].toUpperCase() + e.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {extra}
    </AdvancedSection>
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
      <div className="mt-1.5">{children}</div>
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
      <Button onClick={onClick} disabled={disabled} className="h-12 w-full gap-2 text-[15px]">
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

/**
 * The output canvas — a large framed panel with a title, an optional header
 * actions slot (download / copy / device toggles), and an empty placeholder.
 */
export function OutputPanel({
  title,
  hint,
  actions,
  isEmpty,
  emptyLabel,
  emptyIcon,
  children,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  isEmpty?: boolean;
  emptyLabel?: string;
  emptyIcon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">{title}</span>
          {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/[0.012] px-4 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-violet-300 ring-1 ring-inset ring-violet-400/20">
            {emptyIcon ?? <Wand2 className="size-6" strokeWidth={1.75} aria-hidden />}
          </span>
          <p className="max-w-[26ch] text-sm leading-relaxed text-zinc-500">{emptyLabel}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col space-y-3">{children}</div>
      )}
    </div>
  );
}

/**
 * Refine bar — lets the user iterate on a result ("re-prompt") without retyping
 * the whole form. Shown beneath a result; on submit the runner re-runs with the
 * same inputs plus this adjustment note. Optional quick-suggestion chips.
 */
export function RefineBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder,
  submitLabel,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  placeholder?: string;
  submitLabel: string;
  suggestions?: readonly string[];
}) {
  const canSubmit = !loading && value.trim().length > 0;
  return (
    <div className="mt-auto rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.09] to-indigo-500/[0.04] p-3">
      <div className="flex items-center gap-2">
        <Wand2 className="ml-1 size-4 shrink-0 text-violet-300" aria-hidden />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) onSubmit();
          }}
          placeholder={placeholder}
          className="field flex-1 border-transparent bg-white/[0.05]"
        />
        <Button onClick={onSubmit} disabled={!canSubmit} className="shrink-0 gap-1.5">
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-4" aria-hidden />
          )}
          {submitLabel}
        </Button>
      </div>
      {suggestions?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-violet-400/30 hover:text-violet-200"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Centered loading state for the output panel (e.g. async generation). */
export function RunnerLoading({ label }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <Loader2 className="size-7 animate-spin text-violet-300" aria-hidden />
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
