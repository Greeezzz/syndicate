import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "active" | "pending" | "agreed" | "error" | "neutral";
}

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium border rounded-sm";

  const variants = {
    active: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    pending: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    agreed: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
    error: "border-red-500/40 text-red-400 bg-red-500/10",
    neutral: "border-syndicate-border text-syndicate-muted bg-syndicate-bg/50",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
