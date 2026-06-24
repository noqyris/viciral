"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { prefersReducedMotion } from "@/lib/utils/motion";
import type { SpiralMode } from "@/components/spiral-canvas";

// three.js is heavy — load it only on the client, after hydration.
const SpiralCanvas = dynamic(() => import("@/components/spiral-canvas"), { ssr: false });

/**
 * Full-page glowing helix. Modes 1 & 2 render BEHIND the content (z-0, the
 * canvas is the page background); mode 3 renders in FRONT with `mix-blend-screen`
 * so the light glows over the content edges (max drama). Skipped under
 * prefers-reduced-motion.
 */
export function SpiralThread({ mode = 2 }: { mode?: SpiralMode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only mount gate
    setShow(true);
  }, []);

  if (!show) return null;

  const cls =
    mode === 3
      ? "pointer-events-none fixed inset-0 z-[5] mix-blend-screen"
      : "pointer-events-none fixed inset-0 z-0";

  return (
    <div aria-hidden className={cls}>
      <SpiralCanvas mode={mode} />
    </div>
  );
}
