"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Sage", hex: "#8a9a8b" },
  { name: "Dusty Pink", hex: "#d8a7a3" },
  { name: "Terracotta", hex: "#c2725a" },
  { name: "Plum", hex: "#7c5478" },
  { name: "Navy", hex: "#1f3a5f" },
  { name: "Charcoal", hex: "#3a3a3c" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Violet", hex: "#8B5CF6" },
];

interface ColorFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (hex: string) => void;
  /** When true, renders a "None" swatch that clears the value to "". */
  allowEmpty?: boolean;
  /** Inline reset button that appears next to the hint when value is set. */
  onReset?: () => void;
}

/**
 * Brand color picker — preset swatches + native picker + hex input.
 * Used by Forms and Services Style panels. Keep them visually identical.
 */
export function ColorField({ label, hint, value, onChange, allowEmpty = false, onReset }: ColorFieldProps) {
  // Local state for the text input lets users type partial hex strings
  // without each keystroke clobbering value upstream. Sync on external
  // changes (preset clicks, parent reset).
  const [typed, setTyped] = useState(value);
  useEffect(() => {
    setTyped(value);
  }, [value]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
          {label}
        </label>
        {onReset && value && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-text-secondary hover:text-foreground cursor-pointer underline underline-offset-2"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {allowEmpty && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="None"
            className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform flex items-center justify-center ${
              !value ? "border-foreground scale-110" : "border-border-light hover:scale-105"
            }`}
          >
            <X className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        )}
        {COLOR_PRESETS.map((preset) => {
          const selected = preset.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange(preset.hex)}
              title={preset.name}
              className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                selected ? "border-foreground scale-110" : "border-border-light hover:scale-105"
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-surface border border-border-light rounded-lg w-fit">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          type="text"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          className="w-20 bg-transparent text-[12px] font-mono text-foreground outline-none tabular-nums"
          placeholder="#000000"
        />
      </div>
      {hint && <p className="text-[11px] text-text-tertiary mt-1.5">{hint}</p>}
    </div>
  );
}
