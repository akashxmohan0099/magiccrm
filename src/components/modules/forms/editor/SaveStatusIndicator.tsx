"use client";

import { X, Check } from "lucide-react";

export function SaveStatusIndicator({
  status,
  canSave,
  slugError,
  nameError,
  optionsError,
  fieldNameError,
  saveError,
  onRetry,
}: {
  status: "idle" | "pending" | "saving" | "saved" | "error";
  canSave: boolean;
  slugError: string;
  nameError: string;
  optionsError: string;
  fieldNameError: string;
  saveError: string | null;
  onRetry: () => void;
}) {
  if (!canSave) {
    const blocker = nameError || slugError || optionsError || fieldNameError || "fix the errors above";
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-red-600 py-2">
        <X className="w-3.5 h-3.5" />
        <span>Can&apos;t autosave — {blocker}</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center justify-center gap-2 text-[12.5px] text-red-600 py-2">
        <X className="w-3.5 h-3.5" />
        <span>Save failed{saveError ? ` — ${saveError}` : ""}.</span>
        <button
          type="button"
          onClick={onRetry}
          className="underline font-medium hover:text-red-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }
  // "Pending" (debounce timer waiting) and "saving" (network in flight) read
  // the same to the user — both mean "not yet safely persisted".
  if (status === "pending" || status === "saving") {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-text-tertiary py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse" />
        <span>{status === "saving" ? "Saving…" : "Saving…"}</span>
      </div>
    );
  }
  if (status === "saved") {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-emerald-600 py-2">
        <Check className="w-3.5 h-3.5" />
        <span>Saved</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-text-tertiary py-2">
      <Check className="w-3.5 h-3.5" />
      <span>All changes saved</span>
    </div>
  );
}
