"use client";

import { InputHTMLAttributes } from "react";

export function DateField({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="date"
      className={`w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${className}`}
      {...props}
    />
  );
}
