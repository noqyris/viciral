"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { prefersReducedMotion } from "@/lib/utils/motion";
import type { SpiralMode } from "@/components/spiral-canvas";

// three.js is heavy — load it only on the client, after hydration.
const SpiralCanvas = dynamic(() => import("@/components/spiral-canvas"), { ssr: false });

/**
 * Full-page glowing helix rendered BEHIND the content (z-0); the page is
 * semi-transparent over it (`.section-pit` veil) so the spiral glows through as
 * it descends the page. Skipped under prefers-reduced-motion.
 */
export function SpiralThread({ mode = 2 }: { mode?: SpiralMode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only mount gate
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <SpiralCanvas mode={mode} />
    </div>
  );
}
