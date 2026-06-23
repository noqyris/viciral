"use client";

import { useEffect, useRef, useState } from "react";

type Dir = "up" | "left" | "right";

const HIDDEN: Record<Dir, string> = {
  up: "translate-y-10 opacity-0",
  left: "-translate-x-10 opacity-0",
  right: "translate-x-10 opacity-0",
};

/**
 * Reveals its children with a transition the first time they scroll into view
 * (IntersectionObserver — no animation lib). `delay` staggers siblings.
 */
export function Reveal({
  children,
  className = "",
  dir = "up",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  dir?: Dir;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        shown ? "translate-x-0 translate-y-0 opacity-100" : HIDDEN[dir]
      } ${className}`}
    >
      {children}
    </div>
  );
}
