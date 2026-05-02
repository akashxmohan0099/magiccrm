"use client";

import { useState, useEffect } from "react";

// Local-state textarea that persists on blur (or when the user pauses
// typing for a moment). Avoids spamming Supabase on every keystroke
// while still feeling like an auto-saving notes panel.
export function NotesEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [savedValue, setSavedValue] = useState(initial);
  const [showSavedAt, setShowSavedAt] = useState<number | null>(null);

  // Pending state is derived — no setState in render, no setState
  // synchronously in an effect body.
  const isPending = value !== savedValue;

  // Debounced auto-save: 1.2s after the last keystroke. The setStates
  // here run inside the timeout callback (async), not the effect body.
  useEffect(() => {
    if (!isPending) return;
    const t = setTimeout(() => {
      onSave(value);
      setSavedValue(value);
      setShowSavedAt(Date.now());
    }, 1200);
    return () => clearTimeout(t);
  }, [value, isPending, onSave]);

  // Hide the "Saved" indicator after 1.5s.
  useEffect(() => {
    if (showSavedAt === null) return;
    const t = setTimeout(() => setShowSavedAt(null), 1500);
    return () => clearTimeout(t);
  }, [showSavedAt]);

  const flushOnBlur = () => {
    if (!isPending) return;
    onSave(value);
    setSavedValue(value);
    setShowSavedAt(Date.now());
  };

  const status = isPending ? "saving" : showSavedAt !== null ? "saved" : "idle";

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
          Internal notes
        </h4>
        <span className="text-[11px] text-text-tertiary">
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={flushOnBlur}
        rows={3}
        placeholder="Anything you want to remember about this lead — only your team will see this."
        className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:border-foreground/30 transition-colors resize-y"
      />
    </div>
  );
}
