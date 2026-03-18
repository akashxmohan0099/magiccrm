"use client";

import { TextareaHTMLAttributes } from "react";

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none ${className}`}
      rows={3}
      {...props}
    />
  );
}
