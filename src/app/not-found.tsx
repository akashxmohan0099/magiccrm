"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "var(--logo-green)" }}>
        <div className="w-5 h-5 bg-card-bg rounded-md" />
      </div>
      <h1 className="text-[64px] font-bold text-foreground leading-none mb-2">404</h1>
      <p className="text-[17px] text-text-secondary mb-8">This page doesn&apos;t exist.</p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border-warm bg-card-bg px-5 py-2 text-[13px] font-semibold tracking-[-0.01em] text-foreground transition-colors hover:bg-surface"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-[13px] font-semibold tracking-[-0.01em] text-background transition-opacity hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
