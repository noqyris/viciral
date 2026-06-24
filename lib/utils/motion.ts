/**
 * Small client-side motion helpers shared across the landing animations:
 * the reduced-motion gate plus a tiny requestAnimationFrame count-up loop.
 * Pure UI utilities — only call these in the browser (effects / event handlers).
 */

/** True when the user has asked for reduced motion. SSR-safe (returns false). */
export function prefersReducedMotion(): boolean {
  return typeof window === "undefined"
    ? false
    : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cubic ease-out: fast start, gentle settle. `t` in [0, 1]. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a numeric value from `from` to `to` over `duration` ms with an
 * ease-out-cubic curve, calling `onUpdate` each frame and `onDone` at the end.
 * Returns a cancel function so callers can abort on unmount.
 */
export function animateValue({
  from,
  to,
  duration,
  onUpdate,
  onDone,
}: {
  from: number;
  to: number;
  duration: number;
  onUpdate: (value: number) => void;
  onDone?: () => void;
}): () => void {
  let raf = 0;
  const start = performance.now();

  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    onUpdate(from + (to - from) * easeOutCubic(p));
    if (p < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
