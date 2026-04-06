"use client";

import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

/**
 * Root-level error boundary for all routes (except the root layout).
 * Next.js convention file -- catches unhandled errors in page rendering.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "var(--logo-green)" }}
        >
          <div className="w-5 h-5 bg-card-bg rounded-md" />
        </div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          An unexpected error occurred. Please try again or return to the dashboard.
          {error.digest && (
            <span className="block mt-2 text-xs text-text-tertiary">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm bg-foreground text-background hover:opacity-90 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm bg-card-bg text-foreground border border-border-light hover:bg-surface transition-all"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
