"use client";

import Link from "next/link";
import { Clock, AlertCircle } from "lucide-react";
import type { UtilizationResult } from "@/lib/calendar/utilization";
import type { NextAvailableSlot } from "@/lib/calendar/next-available";
import { formatNextAvailable } from "@/lib/calendar/next-available";
import type { WorkingHours } from "@/types/models";

interface Props {
  weekly: UtilizationResult;
  today: UtilizationResult;
  /** Label for the calendar week currently visible in the grid. */
  weekLabel: string;
  /** Today / next-available are only shown when the visible grid week is the real current week. */
  showToday: boolean;
  nextAvailable: NextAvailableSlot[];
  now: Date;
  /** Workspace-level working hours, keyed by 3-letter weekday (lower-case). */
  workspaceWorkingHours: Record<string, WorkingHours>;
  /** YYYY-MM-DD of the day "Today" row corresponds to. */
  todayDate: string;
  /** YYYY-MM-DD of the start of the week the "weekly" row covers. */
  weekStartDate: string;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function weekdayKey(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function hasAnyHoursThisWeek(
  weekStartDate: string,
  workspaceWorkingHours: Record<string, WorkingHours>,
): boolean {
  const [y, m, d] = weekStartDate.split("-").map(Number);
  for (let i = 0; i < 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const wk = WEEKDAY_KEYS[dt.getUTCDay()];
    const hrs = workspaceWorkingHours[wk];
    if (hrs?.start && hrs?.end) return true;
  }
  return false;
}

function fmtHours(min: number): string {
  // 90 → "1.5"; 120 → "2"; 480 → "8". One decimal where it adds clarity.
  const hrs = min / 60;
  if (Math.abs(hrs - Math.round(hrs)) < 0.05) return String(Math.round(hrs));
  return hrs.toFixed(1);
}

export function OutlookCard({
  weekly,
  today,
  weekLabel,
  showToday,
  nextAvailable,
  now,
  workspaceWorkingHours,
  todayDate,
  weekStartDate,
}: Props) {
  const todayBookable = today.bookableMinutes > 0;
  const todayHasHours = (() => {
    const hrs = workspaceWorkingHours[weekdayKey(todayDate)];
    return Boolean(hrs?.start && hrs?.end);
  })();
  const weekHasHours = hasAnyHoursThisWeek(weekStartDate, workspaceWorkingHours);

  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-4">
      <p className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase mb-3">
        Outlook
      </p>

      {/* Today — only meaningful when we're showing the current week. */}
      {showToday && (
        <Row
          label="Today"
          value={
            todayBookable
              ? `${fmtHours(today.bookedMinutes)} of ${fmtHours(today.bookableMinutes)} hrs (${Math.round(today.filledPct)}%)`
              : todayHasHours
                ? "Closed"
                : "No hours set"
          }
          pct={todayBookable ? today.filledPct : null}
          unconfigured={!todayBookable && !todayHasHours}
        />
      )}

      <Row
        label={weekLabel}
        value={
          weekly.bookableMinutes === 0
            ? weekHasHours
              ? "Closed"
              : "No hours set"
            : `${fmtHours(weekly.bookedMinutes)} of ${fmtHours(weekly.bookableMinutes)} hrs (${Math.round(weekly.filledPct)}%)`
        }
        pct={weekly.bookableMinutes === 0 ? null : weekly.filledPct}
        unconfigured={weekly.bookableMinutes === 0 && !weekHasHours}
      />

      {/* Next available — most-asked operator question. Only show on "this week" view. */}
      {showToday && nextAvailable.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-text-tertiary" />
            <p className="text-[11px] font-medium text-text-tertiary">Next available</p>
          </div>
          <p className="text-[13px] text-foreground tabular-nums">
            {nextAvailable.map((s) => formatNextAvailable(s, now)).join(" · ")}
          </p>
        </div>
      )}

      {(!todayHasHours || !weekHasHours) && showToday && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 hover:text-amber-900"
          >
            <AlertCircle className="w-3 h-3" />
            Set working hours to start filling the calendar
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  pct,
  unconfigured,
}: {
  label: string;
  value: string;
  pct: number | null;
  unconfigured?: boolean;
}) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] font-medium text-text-tertiary">{label}</span>
        <span
          className={`text-[12px] tabular-nums ${
            unconfigured ? "text-amber-700" : "text-foreground"
          }`}
        >
          {value}
        </span>
      </div>
      {pct !== null && (
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{
              width: `${Math.max(0, Math.min(100, pct))}%`,
              transition: "width 240ms ease",
            }}
          />
        </div>
      )}
    </div>
  );
}
