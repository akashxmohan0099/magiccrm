"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMinutes } from "../helpers";

// 12-hour formatter — kept here (rather than imported) so the preview's time
// grid reads identically to the public TimePicker without coupling them.
function fmtTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

// Local-date ISO formatter. `Date.prototype.toISOString` always returns UTC,
// so a local date like 2 May at 00:00 in +10 produces "2026-05-01" — clicking
// May 2 silently selects May 1. We format from the local components instead.
function fmtLocalISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Inverse: parse a "YYYY-MM-DD" string as a LOCAL date. `new Date(iso)` treats
// the string as UTC midnight, which then shifts when formatted with
// toLocaleDateString in negative timezones.
function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Combined date + time picker. Calendar on top, time grid for the selected
 * date below. Picking a date updates the grid in place — only picking a
 * time advances the flow.
 *
 * On mount, auto-selects the first allowed day from today onward so the
 * customer lands directly on a day with slots instead of an empty grid.
 */
export function Schedule({
  primaryColor,
  duration,
  selectedDate,
  selectedTime,
  allowedWeekdays,
  minDate,
  maxDate,
  onPickDate,
  onPickTime,
}: {
  primaryColor: string;
  duration: number;
  selectedDate: string | null;
  selectedTime: string | null;
  allowedWeekdays: number[] | null;
  /** Earliest bookable date (per-service min notice). Disables earlier days. */
  minDate?: Date;
  /** Latest bookable date (per-service max advance). Disables later days. */
  maxDate?: Date;
  onPickDate: (iso: string) => void;
  onPickTime: (time: string) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { days, monthLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const first = new Date(year, monthIdx, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const cells: {
      iso: string | null;
      day: number | null;
      past: boolean;
      today: boolean;
      disabled: boolean;
    }[] = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ iso: null, day: null, past: false, today: false, disabled: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIdx, d);
      const iso = fmtLocalISO(date);
      const past = date < today;
      const isToday = date.getTime() === today.getTime();
      const weekday = date.getDay();
      const blockedByWeekday =
        allowedWeekdays != null && !allowedWeekdays.includes(weekday);
      const blockedByMinNotice = !!minDate && date < minDate;
      const blockedByMaxAdvance = !!maxDate && date > maxDate;
      cells.push({
        iso,
        day: d,
        past,
        today: isToday,
        disabled: past || blockedByWeekday || blockedByMinNotice || blockedByMaxAdvance,
      });
    }
    return {
      days: cells,
      monthLabel: month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [monthOffset, allowedWeekdays, minDate, maxDate]);

  // Auto-pick the first allowed day from today on first render so the time
  // grid has something to show. Skip when the parent already has a date.
  // The latest onPickDate is held in a ref so we don't re-fire this effect
  // every time the parent re-renders (callers usually pass an inline arrow
  // — without the ref we'd ping-pong with the parent's state updates).
  const onPickDateRef = useRef(onPickDate);
  useEffect(() => {
    onPickDateRef.current = onPickDate;
  });
  useEffect(() => {
    if (selectedDate) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let offset = 0; offset < 90; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      const weekday = d.getDay();
      const okWeekday = allowedWeekdays == null || allowedWeekdays.includes(weekday);
      const okMin = !minDate || d >= minDate;
      const okMax = !maxDate || d <= maxDate;
      const ok = okWeekday && okMin && okMax;
      if (ok) {
        onPickDateRef.current(fmtLocalISO(d));
        return;
      }
    }
  }, [selectedDate, allowedWeekdays, minDate, maxDate]);

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let m = 9 * 60; m + duration <= 17 * 60; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      out.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
    return out;
  }, [duration]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return null;
    return parseLocalISO(selectedDate).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-4 space-y-4">
      {/* Calendar */}
      <div>
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
            const isSelected = selectedDate === cell.iso;
            return (
              <button
                key={i}
                disabled={cell.disabled}
                onClick={() => onPickDate(cell.iso!)}
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

      {/* Time grid for the selected date */}
      <div className="border-t border-border-light pt-4">
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          {selectedDateLabel ?? "Pick a date"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((s) => {
            const isSelected = selectedTime === s;
            return (
              <button
                key={s}
                onClick={() => onPickTime(s)}
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium tabular-nums transition-colors cursor-pointer ${
                  isSelected
                    ? "text-white"
                    : "text-foreground bg-surface hover:bg-surface/70"
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : undefined}
              >
                {fmtTime12h(s)}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-text-tertiary mt-2">
          Slot length: {addMinutes("00:00", duration)} ({duration} min)
        </p>
      </div>
    </div>
  );
}
