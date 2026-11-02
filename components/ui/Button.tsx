import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-mono font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-syndicate-text text-syndicate-bg border-syndicate-border hover:bg-syndicate-muted",
    secondary:
      "bg-syndicate-surface text-syndicate-text border-syndicate-border hover:border-syndicate-text",
    ghost:
      "bg-transparent text-syndicate-text border-transparent hover:bg-syndicate-surface",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-sm",
    md: "px-4 py-2 text-sm rounded-sm",
    lg: "px-6 py-3 text-base rounded-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
