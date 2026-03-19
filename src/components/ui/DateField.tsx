"use client";

import { InputHTMLAttributes } from "react";

interface DateFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Allow selecting dates in the past. Defaults to true. */
  allowPast?: boolean;
}

export function DateField({ className = "", allowPast = true, min, ...props }: DateFieldProps) {
  const minDate = !allowPast && !min ? new Date().toISOString().split("T")[0] : min;

  return (
    <input
      type="date"
      min={minDate}
      className={`w-full px-4 py-3 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all ${className}`}
      {...props}
    />
  );
}
