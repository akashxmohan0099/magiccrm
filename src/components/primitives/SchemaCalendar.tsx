"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FieldDefinition, ViewDefinition, StatusFlow } from "@/types/module-schema";

type RecordData = { id: string; [key: string]: unknown };
type CalendarMode = "day" | "week" | "month";

interface SchemaCalendarProps {
  fields: FieldDefinition[];
  view: ViewDefinition;
  records: RecordData[];
  statusFlow?: StatusFlow;
  onRecordClick?: (record: RecordData) => void;
  onDateSelect?: (date: string) => void;
  onTimeSelect?: (date: string, startTime: string, endTime: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
const PX_PER_HOUR = 64;
const MIN_MINUTES = 420; // 7 AM in minutes

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTimeLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function getStatusColor(status: string, statusFlow?: StatusFlow): string {
  if (!statusFlow) return "bg-primary/20 border-primary/30 text-foreground";
  const state = statusFlow.states.find((s) => s.value === status);
  if (!state) return "bg-primary/20 border-primary/30 text-foreground";
  // Map bg-color to event style
  if (state.isClosed) return "bg-gray-100 border-gray-300 text-gray-500";
  if (state.color.includes("emerald") || state.color.includes("green")) return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (state.color.includes("red")) return "bg-red-50 border-red-200 text-red-500";
  if (state.color.includes("amber") || state.color.includes("yellow")) return "bg-yellow-50 border-yellow-200 text-yellow-800";
  return "bg-primary/20 border-primary/30 text-foreground";
}

// ── Main Component ───────────────────────────────────────────

export function SchemaCalendar({
  fields,
  view,
  records,
  statusFlow,
  onRecordClick,
  onDateSelect,
}: SchemaCalendarProps) {
  const [mode, setMode] = useState<CalendarMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "day" : "week"
  );
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const dateFieldId = view.dateField || "date";
  const statusField = statusFlow?.field;

  // Find name/title field for display
  const titleField = fields.find((f) => f.id === "title" || f.id === "name");
  const titleFieldId = titleField?.id || "title";

  // Find time fields (startTime/endTime) if they exist
  const startTimeField = fields.find((f) => f.id === "startTime");
  const endTimeField = fields.find((f) => f.id === "endTime");

  // Group records by date
  const recordsByDate = useMemo(() => {
    const map: Record<string, RecordData[]> = {};
    for (const record of records) {
      const dateVal = record[dateFieldId] as string;
      if (!dateVal) continue;
      const key = dateVal.slice(0, 10); // "YYYY-MM-DD"
      if (!map[key]) map[key] = [];
      map[key].push(record);
    }
    // Sort by start time if available
    if (startTimeField) {
      for (const arr of Object.values(map)) {
        arr.sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
      }
    }
    return map;
  }, [records, dateFieldId, startTimeField]);

  const todayKey = formatDateKey(new Date());

  const prev = () => {
    const d = new Date(currentDate);
    if (mode === "day") d.setDate(d.getDate() - 1);
    else if (mode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const next = () => {
    const d = new Date(currentDate);
    if (mode === "day") d.setDate(d.getDate() + 1);
    else if (mode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const headerLabel = mode === "day"
    ? currentDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })
    : mode === "week"
    ? (() => {
        const week = getWeekDays(currentDate);
        return `${week[0].toLocaleDateString("default", { month: "short", day: "numeric" })} — ${week[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
      })()
    : currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={prev} aria-label={mode === "day" ? "Previous day" : mode === "week" ? "Previous week" : "Previous month"} className="p-1.5 hover:bg-surface rounded-lg transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={next} aria-label={mode === "day" ? "Next day" : mode === "week" ? "Next week" : "Next month"} className="p-1.5 hover:bg-surface rounded-lg transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
          <h3 className="text-[15px] font-semibold text-foreground ml-1">{headerLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-foreground hover:bg-surface rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          {(["day", "week", "month"] as CalendarMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-label={`${m.charAt(0).toUpperCase() + m.slice(1)} view`}
              aria-pressed={mode === m}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === m ? "bg-foreground text-background" : "text-text-secondary hover:bg-surface"
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {mode === "month" ? (
          <MonthView
            currentDate={currentDate}
            recordsByDate={recordsByDate}
            todayKey={todayKey}
            titleFieldId={titleFieldId}
            statusField={statusField}
            statusFlow={statusFlow}
            onRecordClick={onRecordClick}
            onDateSelect={onDateSelect}
          />
        ) : (
          <TimeGridView
            mode={mode}
            currentDate={currentDate}
            recordsByDate={recordsByDate}
            todayKey={todayKey}
            titleFieldId={titleFieldId}
            statusField={statusField}
            statusFlow={statusFlow}
            hasTimeFields={!!startTimeField && !!endTimeField}
            onRecordClick={onRecordClick}
          />
        )}
      </div>
    </div>
  );
}

// ── Month View ───────────────────────────────────────────────

function MonthView({
  currentDate, recordsByDate, todayKey, titleFieldId, statusField, statusFlow, onRecordClick, onDateSelect,
}: {
  currentDate: Date;
  recordsByDate: Record<string, RecordData[]>;
  todayKey: string;
  titleFieldId: string;
  statusField?: string;
  statusFlow?: StatusFlow;
  onRecordClick?: (r: RecordData) => void;
  onDateSelect?: (date: string) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="border border-border-light rounded-xl overflow-hidden" role="grid" aria-label="Month calendar">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border-light" role="row">
        {DAY_LABELS.map((d) => (
          <div key={d} role="columnheader" className="py-2 text-center text-[11px] font-semibold text-text-tertiary uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} role="gridcell" className="min-h-[80px] bg-surface/30 border-b border-r border-border-light/50" />;

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayRecords = recordsByDate[dateKey] || [];
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              role="gridcell"
              tabIndex={0}
              aria-label={`${new Date(year, month, day).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}${dayRecords.length > 0 ? `, ${dayRecords.length} events` : ""}`}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onDateSelect?.(dateKey)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDateSelect?.(dateKey);
                }
              }}
              className={`min-h-[80px] p-1.5 border-b border-r border-border-light/50 cursor-pointer hover:bg-surface/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset ${
                isToday ? "bg-primary/[0.03]" : ""
              }`}
            >
              <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                isToday ? "bg-primary text-white" : "text-text-secondary"
              }`}>
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayRecords.slice(0, 3).map((record) => {
                  const status = statusField ? (record[statusField] as string) : undefined;
                  const title = String(record[titleFieldId] || "");
                  return (
                    <div
                      key={record.id}
                      role="button"
                      tabIndex={0}
                      aria-label={title}
                      onClick={(e) => { e.stopPropagation(); onRecordClick?.(record); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onRecordClick?.(record);
                        }
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${getStatusColor(status || "", statusFlow)}`}
                    >
                      {title}
                    </div>
                  );
                })}
                {dayRecords.length > 3 && (
                  <span className="text-[10px] text-text-tertiary pl-1">+{dayRecords.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Time Grid View (Day / Week) ──────────────────────────────

function TimeGridView({
  mode, currentDate, recordsByDate, todayKey, titleFieldId, statusField, statusFlow, hasTimeFields, onRecordClick,
}: {
  mode: "day" | "week";
  currentDate: Date;
  recordsByDate: Record<string, RecordData[]>;
  todayKey: string;
  titleFieldId: string;
  statusField?: string;
  statusFlow?: StatusFlow;
  hasTimeFields: boolean;
  onRecordClick?: (r: RecordData) => void;
}) {
  const days = mode === "day"
    ? [currentDate]
    : getWeekDays(currentDate);

  return (
    <div className="overflow-x-auto">
     <div className={`flex ${mode === "week" ? "min-w-[600px]" : ""}`}>
      {/* Time labels */}
      <div className="w-12 sm:w-16 flex-shrink-0 border-r border-border-light">
        <div className="h-10" /> {/* Header spacer */}
        {HOURS.map((hour) => (
          <div key={hour} className="relative" style={{ height: PX_PER_HOUR }}>
            <span className="absolute -top-2.5 right-3 text-[11px] text-text-tertiary">
              {formatTimeLabel(hour)}
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className={`flex-1 grid ${mode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const isToday = dateKey === todayKey;
          const dayRecords = recordsByDate[dateKey] || [];

          return (
            <div key={dateKey} className="border-r border-border-light last:border-r-0">
              {/* Day header */}
              <div className={`h-10 flex items-center justify-center border-b border-border-light ${isToday ? "bg-primary/[0.03]" : ""}`}>
                <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-text-secondary"}`}>
                  {mode === "week" ? `${DAY_LABELS[day.getDay()]} ${day.getDate()}` : ""}
                </span>
              </div>

              {/* Time grid */}
              <div className="relative">
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div key={hour} className="border-b border-border-light/50" style={{ height: PX_PER_HOUR }} />
                ))}

                {/* Events */}
                {dayRecords.map((record) => {
                  const title = String(record[titleFieldId] || "");
                  if (!hasTimeFields) {
                    // No time fields — render as all-day events at top
                    return (
                      <div
                        key={record.id}
                        role="button"
                        tabIndex={0}
                        aria-label={title}
                        onClick={() => onRecordClick?.(record)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRecordClick?.(record);
                          }
                        }}
                        className={`absolute left-1 right-1 top-1 px-2 py-1 rounded-lg border text-[11px] font-medium truncate cursor-pointer ${
                          getStatusColor(statusField ? (record[statusField] as string) : "", statusFlow)
                        }`}
                      >
                        {title}
                      </div>
                    );
                  }

                  const startTime = record.startTime as string;
                  const endTime = record.endTime as string;
                  if (!startTime || !endTime) return null;

                  const startMin = timeToMinutes(startTime);
                  const endMin = timeToMinutes(endTime);
                  const top = ((startMin - MIN_MINUTES) / 60) * PX_PER_HOUR;
                  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 20);
                  const status = statusField ? (record[statusField] as string) : "";

                  return (
                    <div
                      key={record.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${title}, ${startTime} to ${endTime}`}
                      onClick={() => onRecordClick?.(record)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRecordClick?.(record);
                        }
                      }}
                      className={`absolute left-1 right-1 px-2 py-1 rounded-lg border overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${
                        getStatusColor(status, statusFlow)
                      }`}
                      style={{ top, height }}
                    >
                      <p className="text-[11px] font-semibold truncate">{title}</p>
                      <p className="text-[10px] opacity-70">
                        {startTime} — {endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
     </div>
    </div>
  );
}
