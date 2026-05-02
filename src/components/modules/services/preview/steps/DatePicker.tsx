"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DatePicker({
  primaryColor,
  selected,
  allowedWeekdays,
  onPick,
}: {
  primaryColor: string;
  selected: string | null;
  allowedWeekdays: number[] | null;
  onPick: (iso: string) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { days, monthLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const first = new Date(year, monthIdx, 1);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const cells: { iso: string | null; day: number | null; past: boolean; today: boolean; disabled: boolean }[] = [];
    for (let i = 0; i < startDay; i++)
      cells.push({ iso: null, day: null, past: false, today: false, disabled: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIdx, d);
      const iso = date.toISOString().slice(0, 10);
      const past = date < today;
      const isToday = date.getTime() === today.getTime();
      const weekday = date.getDay();
      const blockedByWeekday =
        allowedWeekdays != null && !allowedWeekdays.includes(weekday);
      cells.push({ iso, day: d, past, today: isToday, disabled: past || blockedByWeekday });
    }
    return {
      days: cells,
      monthLabel: month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [monthOffset, allowedWeekdays]);

  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthOffset((v) => Math.max(0, v - 1))}
          disabled={monthOffset === 0}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-[14px] font-semibold text-foreground">{monthLabel}</p>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[11px] text-text-tertiary mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell.iso) return <div key={i} />;
          const isSelected = selected === cell.iso;
          return (
            <button
              key={i}
              disabled={cell.disabled}
              onClick={() => onPick(cell.iso!)}
              className={`aspect-square rounded-lg text-[13px] font-medium tabular-nums cursor-pointer transition-colors relative ${
                isSelected
                  ? "text-white"
                  : cell.disabled
                    ? "text-text-tertiary/40 cursor-not-allowed"
                    : cell.today
                      ? "text-foreground bg-surface"
                      : "text-foreground hover:bg-surface"
              }`}
              style={isSelected ? { backgroundColor: primaryColor } : undefined}
            >
              {cell.day}
              {cell.today && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
