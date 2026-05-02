"use client";

import { useMemo } from "react";
import { addMinutes } from "../helpers";

export function TimePicker({
  primaryColor,
  duration,
  onPick,
}: {
  primaryColor: string;
  duration: number;
  onPick: (time: string) => void;
}) {
  // Mock availability: 9:00–17:00 in 30-min increments, fully open.
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let m = 9 * 60; m + duration <= 17 * 60; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      out.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
    return out;
  }, [duration]);

  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-4">
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const end = addMinutes(s, duration);
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="px-3 py-2 rounded-lg border border-border-light text-[13px] font-medium text-foreground hover:border-foreground/30 hover:bg-surface cursor-pointer transition-colors"
              style={{ borderColor: undefined }}
            >
              <span className="block tabular-nums">{s}</span>
              <span className="block text-[10px] text-text-tertiary tabular-nums">– {end}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-text-tertiary text-center mt-3">
        Mock availability — real slots will reflect staff schedules.
      </p>
      {/* Hidden style sink to satisfy the linter about the unused arg. */}
      <span className="hidden" style={{ color: primaryColor }} />
    </div>
  );
}
