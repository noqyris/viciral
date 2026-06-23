import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] focus-visible:ring-violet-500";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_8px_30px_-10px_rgba(139,92,246,0.7)] hover:from-violet-400 hover:to-indigo-400 hover:shadow-[0_10px_36px_-8px_rgba(139,92,246,0.85)]",
  secondary:
    "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 hover:border-white/20",
  ghost: "text-zinc-300 hover:bg-white/5 hover:text-white",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
