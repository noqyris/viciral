import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500";

const variants: Record<Variant, string> = {
  primary: "bg-violet-600 text-white hover:bg-violet-500",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  ghost: "text-zinc-700 hover:bg-zinc-100",
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
