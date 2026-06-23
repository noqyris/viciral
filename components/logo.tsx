import Link from "next/link";

/**
 * Brand mark — the gradient "V" tile used as favicon, in the nav, sidebar, hero
 * and auth screens. Rendered inline as SVG so it stays crisp at any size and can
 * pick up an ambient glow. The gradient defs are identical across instances, so
 * sharing the same ids across multiple marks on a page renders correctly.
 */
export function BrandMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="vcl-tile" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="0.52" stopColor="#6366f1" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="vcl-sheen" x1="16" y1="0" x2="16" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#vcl-tile)" />
      <rect width="32" height="32" rx="9" fill="url(#vcl-sheen)" />
      <path
        d="M9.5 10.8 L16 21.8 L22.5 10.8"
        stroke="#ffffff"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 4.7 C25.25 6.25 25.78 6.78 27.3 7.03 C25.78 7.28 25.25 7.81 25 9.36 C24.75 7.81 24.22 7.28 22.7 7.03 C24.22 6.78 24.75 6.25 25 4.7 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

/** Mark + "Viciral" wordmark. Links home by default. */
export function Logo({
  size = 28,
  href = "/",
  withWordmark = true,
  glow = false,
  className = "",
  wordmarkClassName = "text-lg font-semibold tracking-tight text-white",
}: {
  size?: number;
  href?: string | null;
  withWordmark?: boolean;
  glow?: boolean;
  className?: string;
  wordmarkClassName?: string;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid place-items-center rounded-[10px] ${
          glow ? "shadow-[0_8px_34px_-8px_rgba(139,92,246,0.85)]" : ""
        }`}
      >
        <BrandMark size={size} />
      </span>
      {withWordmark && <span className={wordmarkClassName}>Viciral</span>}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Viciral">
      {inner}
    </Link>
  );
}
