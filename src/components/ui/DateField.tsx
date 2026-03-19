"use client";

import { InputHTMLAttributes } from "react";

export function DateField({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="date"
      className={`w-full px-4 py-3 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all ${className}`}
      {...props}
    />
  );
}
