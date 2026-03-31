"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className = "", children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed tracking-[-0.01em] select-none active:scale-[0.97]";

    const variants = {
      primary:
        "bg-foreground text-background hover:opacity-90",
      secondary:
        "bg-card-bg text-foreground border border-border-warm hover:bg-surface",
      ghost:
        "text-text-secondary hover:text-foreground hover:bg-surface rounded-xl",
      danger:
        "bg-red-500 text-white hover:bg-red-600",
    };

    const sizes = {
      sm: "px-5 py-2 text-[13px] gap-1.5",
      md: "px-6 py-3 text-sm gap-2",
      lg: "px-8 py-3.5 text-[15px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        aria-disabled={disabled || loading || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
