"use client";

import { useEffect, useState } from "react";
import { SpiralThread } from "@/components/spiral-thread";
import type { SpiralMode } from "@/components/spiral-canvas";

const KEY = "viciral.spiralMode";
const OPTIONS: { mode: SpiralMode; label: string }[] = [
  { mode: 1, label: "Subtle" },
  { mode: 2, label: "Bold" },
  { mode: 3, label: "Max" },
];

/**
 * Renders the spiral plus a small on-page switcher so the prominence (1/2/3) can
 * be tried live and the choice persisted. Remove this component (use
 * <SpiralThread mode={…}/> directly) once a mode is locked in.
 */
export function SpiralController() {
  const [mode, setMode] = useState<SpiralMode>(2);

  useEffect(() => {
    const saved = Number(localStorage.getItem(KEY));
    if (saved === 1 || saved === 2 || saved === 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted choice on mount
      setMode(saved);
    }
  }, []);

  function pick(m: SpiralMode) {
    setMode(m);
    localStorage.setItem(KEY, String(m));
  }

  return (
    <>
      <SpiralThread mode={mode} />
      <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/55 px-1.5 py-1 text-xs shadow-[0_8px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <span className="mono px-2 text-[11px] uppercase tracking-wider text-zinc-400">Spirala</span>
        {OPTIONS.map((o) => (
          <button
            key={o.mode}
            type="button"
            onClick={() => pick(o.mode)}
            aria-pressed={mode === o.mode}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              mode === o.mode
                ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
                : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            {o.mode} · {o.label}
          </button>
        ))}
      </div>
    </>
  );
}
