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
      "inline-flex items-center justify-center font-medium rounded-[10px] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed tracking-[-0.01em] select-none active:scale-[0.97]";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(91,91,214,0.15)] hover:shadow-[0_4px_12px_rgba(91,91,214,0.2),0_0_0_1px_rgba(91,91,214,0.25)]",
      secondary:
        "bg-white text-foreground border border-border-warm hover:bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
      ghost:
        "text-text-secondary hover:text-foreground hover:bg-surface",
      danger:
        "bg-red-500 text-white hover:bg-red-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
    };

    const sizes = {
      sm: "px-3.5 py-1.5 text-[13px] gap-1.5",
      md: "px-5 py-2.5 text-[14px] gap-2",
      lg: "px-7 py-3 text-[15px] gap-2.5",
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
