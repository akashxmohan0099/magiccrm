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
      "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed tracking-tight active:scale-[0.97] select-none";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover shadow-[0px_1px_2px_0px_rgba(37,99,235,0.15),0px_-1px_1px_0px_rgba(0,0,0,0.10)_inset] hover:shadow-[0px_4px_16px_0px_rgba(37,99,235,0.30),0px_-1px_1px_0px_rgba(0,0,0,0.10)_inset]",
      secondary:
        "bg-card-bg text-foreground border border-border-warm hover:bg-surface shadow-sm hover:shadow",
      ghost: "text-text-secondary hover:text-foreground hover:bg-surface",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
    };

    const sizes = {
      sm: "px-4 py-1.5 text-sm gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-8 py-3 text-[15px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
