"use client";

import { RefreshCw, LayoutDashboard } from "lucide-react";

/**
 * Dashboard-level error boundary.
 * Catches errors within the dashboard layout without breaking the shell.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-card-bg border border-border-light rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-5 h-5 text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          This page encountered an error
        </h2>
        <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
          Something went wrong loading this module. Your data is safe.
          {error.digest && (
            <span className="block mt-2 text-xs text-text-tertiary">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm bg-foreground text-background hover:opacity-90 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Reload module
        </button>
      </div>
    </div>
  );
}
