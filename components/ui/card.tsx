import * as React from "react";

export function Card({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm ${className}`}
      {...props}
    />
  );
}
