"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Coffee, Ban, Clock } from "lucide-react";
import { Booking, BookingType } from "@/types/models";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";

interface CalendarViewProps {
  bookings: Booking[];
  onDateSelect: (date: string) => void;
  onBookingClick: (booking: Booking) => void;
  onTimeSelect?: (date: string, startTime: string, endTime: string) => void;
}

type CalendarMode = "today" | "week" | "month";

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

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function snapTo15(yOffset: number): number {
  const totalMinutes = MIN_MINUTES + (yOffset / PX_PER_HOUR) * 60;
  const snapped = Math.round(totalMinutes / 15) * 15;
  return Math.max(MIN_MINUTES, Math.min(snapped, MIN_MINUTES + HOURS.length * 60));
}

function formatTimeLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

const TYPE_STYLES: Record<string, string> = {
  appointment: "bg-primary/20 border-primary/30 text-foreground",
  confirmed: "bg-primary/20 border-primary/30 text-foreground",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-800",
  completed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  cancelled: "bg-red-50 border-red-200 text-red-500 line-through opacity-50",
  break: "bg-amber-50 border-amber-200 text-amber-700",
  unavailable: "bg-gray-100 border-gray-300 text-gray-500",
};

function getBookingStyle(b: Booking): string {
  if (b.bookingType === "break") return TYPE_STYLES.break;
  if (b.bookingType === "unavailable") return TYPE_STYLES.unavailable;
  return TYPE_STYLES[b.status] || TYPE_STYLES.appointment;
}

export function CalendarView({ bookings, onDateSelect, onBookingClick, onTimeSelect }: CalendarViewProps) {
  const { clients } = useClientsStore();
  const { addBooking } = useBookingsStore();
  const [mode, setMode] = useState<CalendarMode>("today");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartMin, setDragStartMin] = useState(0);
  const [dragEndMin, setDragEndMin] = useState(0);
  const [dragDateKey, setDragDateKey] = useState("");
  const [dragDayIdx, setDragDayIdx] = useState(-1);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddPos, setQuickAddPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const weekGridRef = useRef<HTMLDivElement>(null);

  const todayKey = formatDateKey(new Date());

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [bookings]);

  const prev = () => {
    const d = new Date(currentDate);
    if (mode === "today") d.setDate(d.getDate() - 1);
    else if (mode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const next = () => {
    const d = new Date(currentDate);
    if (mode === "today") d.setDate(d.getDate() + 1);
    else if (mode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const headerLabel = mode === "today"
    ? currentDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })
    : mode === "week"
    ? (() => {
        const week = getWeekDays(currentDate);
        return `${week[0].toLocaleDateString("default", { month: "short", day: "numeric" })} — ${week[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
      })()
    : currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // ── Drag handlers (shared by day + week) ──
  const getMinutesFromY = useCallback((clientY: number, ref: React.RefObject<HTMLDivElement | null>): number => {
    if (!ref.current) return MIN_MINUTES;
    const rect = ref.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return snapTo15(y);
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>, dateKey: string, dayIdx?: number) => {
    if (e.button !== 0) return;
    const mins = getMinutesFromY(e.clientY, ref);
    setIsDragging(true);
    setDragStartMin(mins);
    setDragEndMin(mins + 30);
    setDragDateKey(dateKey);
    setDragDayIdx(dayIdx ?? -1);
    setShowQuickAdd(false);
  }, [getMinutesFromY]);

  const moveDrag = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!isDragging) return;
    const mins = getMinutesFromY(e.clientY, ref);
    setDragEndMin(Math.max(mins, dragStartMin + 15));
  }, [isDragging, dragStartMin, getMinutesFromY]);

  const endDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const finalEnd = Math.max(dragEndMin, dragStartMin + 15);
    setDragEndMin(finalEnd);
    setShowQuickAdd(true);
    setQuickAddPos({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStartMin, dragEndMin]);

  const cancelDrag = useCallback(() => {
    if (isDragging) { setIsDragging(false); setShowQuickAdd(false); }
  }, [isDragging]);

  const createBlock = useCallback((type: BookingType) => {
    const dateKey = dragDateKey || formatDateKey(currentDate);
    const start = Math.min(dragStartMin, dragEndMin);
    const end = Math.max(dragStartMin, dragEndMin);
    const title = type === "break" ? "Break" : type === "unavailable" ? "Unavailable" : "";

    if (type === "appointment") {
      if (onTimeSelect) {
        onTimeSelect(dateKey, minutesToTime(start), minutesToTime(end));
      } else {
        onDateSelect(dateKey);
      }
    } else {
      addBooking({
        title,
        date: dateKey,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        status: "confirmed",
        bookingType: type,
        notes: "",
      });
    }
    setShowQuickAdd(false);
  }, [currentDate, dragDateKey, dragStartMin, dragEndMin, onTimeSelect, onDateSelect, addBooking]);

  // Booking preview popup
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  const handleBookingPreview = useCallback((b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewBooking(b);
    setPreviewPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closePreview = useCallback(() => setPreviewBooking(null), []);

  const dragTop = ((Math.min(dragStartMin, dragEndMin) - MIN_MINUTES) / 60) * PX_PER_HOUR;
  const dragHeight = Math.max((Math.abs(dragEndMin - dragStartMin) / 60) * PX_PER_HOUR, 16);

  const WEEK_PX_PER_HOUR = 48;

  return (
    <div className="space-y-4">
      <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={next} className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            <h3 className="text-[14px] font-semibold text-foreground ml-1">{headerLabel}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="text-[12px] font-medium text-text-secondary hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-surface cursor-pointer">Today</button>
            <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border-light">
              {(["today", "week", "month"] as CalendarMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === "today") setCurrentDate(new Date()); }}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${mode === m ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"}`}
                >
                  {m === "today" ? "Day" : m === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── DAY VIEW with drag ── */}
        {mode === "today" && (() => {
          const dateKey = formatDateKey(currentDate);
          const dayBookings = bookingsByDate[dateKey] || [];
          const isToday = dateKey === todayKey;
          const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

          return (
            <div className="relative select-none">
              <div
                ref={gridRef}
                className="relative"
                style={{ height: HOURS.length * PX_PER_HOUR }}
                onMouseDown={(e) => startDrag(e, gridRef, dateKey)}
                onMouseMove={(e) => moveDrag(e, gridRef)}
                onMouseUp={endDrag}
                onMouseLeave={cancelDrag}
              >
                {/* Hour rows */}
                {HOURS.map((hour, i) => (
                  <div key={hour} className="absolute w-full" style={{ top: i * PX_PER_HOUR }}>
                    <div className="flex">
                      <div className="w-16 flex-shrink-0 text-right pr-3 -mt-1.5">
                        <span className="text-[11px] text-text-tertiary">{formatTimeLabel(hour)}</span>
                      </div>
                      <div className="flex-1 border-t border-border-light relative" style={{ height: PX_PER_HOUR }}>
                        <div className="absolute left-0 right-0 top-[25%] border-t border-border-light/30" />
                        <div className="absolute left-0 right-0 top-[50%] border-t border-border-light/50" />
                        <div className="absolute left-0 right-0 top-[75%] border-t border-border-light/30" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Current time line */}
                {isToday && nowMinutes >= MIN_MINUTES && nowMinutes <= MIN_MINUTES + HOURS.length * 60 && (
                  <div className="absolute left-16 right-0 flex items-center z-20 pointer-events-none" style={{ top: ((nowMinutes - MIN_MINUTES) / 60) * PX_PER_HOUR }}>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                )}

                {/* Drag ghost / selection block */}
                {(isDragging || showQuickAdd) && (
                  <div
                    className={`absolute left-[72px] right-3 rounded-lg z-10 pointer-events-none flex items-center justify-center ${
                      isDragging
                        ? "bg-primary/15 border-2 border-dashed border-primary/40"
                        : "bg-primary/10 border-2 border-primary/30"
                    }`}
                    style={{ top: dragTop, height: dragHeight }}
                  >
                    <span className="text-[11px] font-medium text-primary">
                      {minutesToTime(Math.min(dragStartMin, dragEndMin))} — {minutesToTime(Math.max(dragStartMin, dragEndMin))}
                    </span>
                  </div>
                )}

                {/* Booking blocks */}
                {dayBookings.filter(b => b.status !== "cancelled").map((b) => {
                  const startMin = timeToMinutes(b.startTime);
                  const endMin = timeToMinutes(b.endTime);
                  const top = ((startMin - MIN_MINUTES) / 60) * PX_PER_HOUR;
                  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 28);
                  const style = getBookingStyle(b);
                  const isBlock = b.bookingType === "break" || b.bookingType === "unavailable";

                  return (
                    <button
                      key={b.id}
                      onClick={(e) => handleBookingPreview(b, e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`absolute left-[72px] right-3 rounded-lg border px-3 py-1.5 cursor-pointer hover:shadow-md transition-shadow z-[5] ${style} ${isBlock ? "opacity-80" : ""}`}
                      style={{ top: Math.max(top, 0), height }}
                    >
                      <div className="flex items-center gap-1.5">
                        {b.bookingType === "break" && <Coffee className="w-3 h-3 flex-shrink-0" />}
                        {b.bookingType === "unavailable" && <Ban className="w-3 h-3 flex-shrink-0" />}
                        <p className="text-[12px] font-semibold truncate">{b.title || (b.bookingType === "break" ? "Break" : "Unavailable")}</p>
                      </div>
                      {!isBlock && (
                        <p className="text-[11px] text-text-secondary truncate">
                          {b.startTime} – {b.endTime}
                          {b.serviceName ? ` · ${b.serviceName}` : ""}
                          {b.clientId && clientMap[b.clientId] ? ` · ${clientMap[b.clientId]}` : ""}
                        </p>
                      )}
                      {isBlock && <p className="text-[10px] opacity-70">{b.startTime} – {b.endTime}</p>}
                    </button>
                  );
                })}
              </div>

              {/* Empty day */}
              {dayBookings.length === 0 && !isDragging && !showQuickAdd && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-card-bg/90 rounded-xl px-6 py-4 pointer-events-auto">
                    <p className="text-[13px] text-text-tertiary mb-2">Drag to add an appointment, break, or block time</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── WEEK VIEW with drag ── */}
        {mode === "week" && (() => {
          const weekDays = getWeekDays(currentDate);
          const weekDragTop = ((Math.min(dragStartMin, dragEndMin) - MIN_MINUTES) / 60) * WEEK_PX_PER_HOUR;
          const weekDragHeight = Math.max((Math.abs(dragEndMin - dragStartMin) / 60) * WEEK_PX_PER_HOUR, 12);

          return (
            <div className="select-none">
              {/* Day headers — double-click to go to day view */}
              <div className="grid grid-cols-7 border-b border-border-light">
                {weekDays.map((d, i) => {
                  const dk = formatDateKey(d);
                  const isToday = dk === todayKey;
                  return (
                    <button
                      key={i}
                      onDoubleClick={() => { setCurrentDate(new Date(d)); setMode("today"); }}
                      className={`text-center py-2 cursor-pointer hover:bg-surface transition-colors ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <p className="text-[10px] text-text-tertiary font-medium">{DAY_LABELS[i]}</p>
                      <p className={`text-[14px] font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              {/* Time grid with drag */}
              <div
                ref={weekGridRef}
                className="relative"
                style={{ height: HOURS.length * WEEK_PX_PER_HOUR }}
                onMouseMove={(e) => moveDrag(e, weekGridRef)}
                onMouseUp={endDrag}
                onMouseLeave={cancelDrag}
              >
                {HOURS.map((hour, i) => (
                  <div key={hour} className="absolute w-full flex items-start" style={{ top: i * WEEK_PX_PER_HOUR }}>
                    <div className="w-12 flex-shrink-0 text-right pr-2 -mt-1.5">
                      <span className="text-[10px] text-text-tertiary">{formatTimeLabel(hour)}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-7">
                      {weekDays.map((wd, j) => (
                        <div
                          key={j}
                          className="border-t border-l border-border-light relative cursor-crosshair hover:bg-primary/5 transition-colors"
                          style={{ height: WEEK_PX_PER_HOUR }}
                          onMouseDown={(e) => startDrag(e, weekGridRef, formatDateKey(wd), j)}
                        >
                          <div className="absolute left-0 right-0 top-[50%] border-t border-border-light/40" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Week drag ghost */}
                {(isDragging || showQuickAdd) && dragDayIdx >= 0 && (
                  <div
                    className={`absolute rounded-lg z-10 pointer-events-none flex items-center justify-center text-[10px] font-medium text-primary ${
                      isDragging ? "bg-primary/15 border-2 border-dashed border-primary/40" : "bg-primary/10 border-2 border-primary/30"
                    }`}
                    style={{
                      top: weekDragTop,
                      height: weekDragHeight,
                      left: `calc(48px + (${dragDayIdx} * (100% - 48px) / 7) + 2px)`,
                      width: `calc((100% - 48px) / 7 - 4px)`,
                    }}
                  >
                    {minutesToTime(Math.min(dragStartMin, dragEndMin))} — {minutesToTime(Math.max(dragStartMin, dragEndMin))}
                  </div>
                )}

                {/* Booking blocks */}
                {weekDays.map((d, dayIdx) => {
                  const dk = formatDateKey(d);
                  const dayBookings = (bookingsByDate[dk] || []).filter(b => b.status !== "cancelled");
                  return dayBookings.map((b) => {
                    const startMin = timeToMinutes(b.startTime);
                    const endMin = timeToMinutes(b.endTime);
                    const top = ((startMin - MIN_MINUTES) / 60) * WEEK_PX_PER_HOUR;
                    const height = Math.max(((endMin - startMin) / 60) * WEEK_PX_PER_HOUR, 22);
                    const style = getBookingStyle(b);
                    return (
                      <button
                        key={b.id}
                        onClick={(e) => handleBookingPreview(b, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`absolute rounded border px-1 py-0.5 cursor-pointer text-left overflow-hidden hover:shadow-sm transition-shadow z-[1] ${style}`}
                        style={{
                          top: Math.max(top, 0), height,
                          left: `calc(48px + (${dayIdx} * (100% - 48px) / 7) + 2px)`,
                          width: `calc((100% - 48px) / 7 - 4px)`,
                        }}
                      >
                        <p className="text-[10px] font-semibold truncate">
                          {b.bookingType === "break" ? "Break" : b.bookingType === "unavailable" ? "Blocked" : b.title}
                        </p>
                        {height > 28 && <p className="text-[9px] text-text-secondary truncate">{b.startTime}</p>}
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          );
        })()}

        {/* ── MONTH VIEW ── */}
        {mode === "month" && (() => {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const prevDays = new Date(year, month, 0).getDate();
          const cells: { day: number; dateKey: string; inMonth: boolean }[] = [];
          for (let i = firstDay - 1; i >= 0; i--) { const d = prevDays - i; cells.push({ day: d, dateKey: formatDateKey(new Date(year, month - 1, d)), inMonth: false }); }
          for (let d = 1; d <= daysInMonth; d++) { cells.push({ day: d, dateKey: formatDateKey(new Date(year, month, d)), inMonth: true }); }
          const rem = 42 - cells.length;
          for (let d = 1; d <= rem; d++) { cells.push({ day: d, dateKey: formatDateKey(new Date(year, month + 1, d)), inMonth: false }); }

          return (
            <>
              <div className="grid grid-cols-7 border-b border-border-light">
                {DAY_LABELS.map((l) => <div key={l} className="text-center text-[11px] font-medium text-text-tertiary py-2">{l}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {cells.map(({ day, dateKey, inMonth }, idx) => {
                  const dayBookings = bookingsByDate[dateKey] || [];
                  const isToday = dateKey === todayKey;
                  return (
                    <button key={idx} onClick={() => { setCurrentDate(new Date(dateKey + "T00:00:00")); setMode("today"); }} className={`relative min-h-[80px] p-1.5 text-left border-b border-r border-border-light transition-colors cursor-pointer ${!inMonth ? "bg-surface/30" : "hover:bg-surface/50"}`}>
                      <span className={`text-[12px] font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? "bg-foreground text-white" : inMonth ? "text-foreground" : "text-text-tertiary/40"}`}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayBookings.slice(0, 2).map((b) => (
                          <div key={b.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${getBookingStyle(b)}`}>
                            {b.bookingType === "break" ? "Break" : b.bookingType === "unavailable" ? "Blocked" : `${b.startTime} ${b.title}`}
                          </div>
                        ))}
                        {dayBookings.length > 2 && <p className="text-[10px] text-text-tertiary px-1.5">+{dayBookings.length - 2} more</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* Quick add popup (shared by day + week drag) */}
      {showQuickAdd && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setShowQuickAdd(false)} />
          <div
            className="fixed z-[95] bg-card-bg rounded-xl border border-border-light shadow-xl p-1.5 min-w-[180px]"
            style={{ left: Math.min(quickAddPos.x, window.innerWidth - 200), top: Math.min(quickAddPos.y, window.innerHeight - 160) }}
          >
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2.5 py-1.5">
              {minutesToTime(Math.min(dragStartMin, dragEndMin))} — {minutesToTime(Math.max(dragStartMin, dragEndMin))}
            </p>
            {[
              { type: "appointment" as BookingType, label: "Appointment", icon: Plus, color: "text-primary" },
              { type: "break" as BookingType, label: "Break", icon: Coffee, color: "text-amber-600" },
              { type: "unavailable" as BookingType, label: "Unavailable", icon: Ban, color: "text-gray-500" },
            ].map((opt) => (
              <button
                key={opt.type}
                onClick={() => createBlock(opt.type)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left"
              >
                <opt.icon className={`w-4 h-4 ${opt.color}`} />
                <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Booking preview popup */}
      {previewBooking && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={closePreview} />
          <div
            className="fixed z-[95] bg-card-bg rounded-xl border border-border-light shadow-xl p-4 min-w-[240px] max-w-[300px]"
            style={{ left: Math.min(previewPos.x, window.innerWidth - 320), top: Math.min(previewPos.y - 60, window.innerHeight - 240) }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {previewBooking.bookingType === "break" && <Coffee className="w-3.5 h-3.5 text-amber-600" />}
                  {previewBooking.bookingType === "unavailable" && <Ban className="w-3.5 h-3.5 text-gray-500" />}
                  <p className="text-[15px] font-semibold text-foreground">
                    {previewBooking.title || (previewBooking.bookingType === "break" ? "Break" : "Unavailable")}
                  </p>
                </div>
                <p className="text-[12px] text-text-secondary">
                  {new Date(previewBooking.date + "T00:00:00").toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                previewBooking.status === "confirmed" ? "bg-emerald-50 text-emerald-700" :
                previewBooking.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                previewBooking.status === "completed" ? "bg-blue-50 text-blue-700" :
                "bg-surface text-text-secondary"
              }`}>
                {previewBooking.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-[13px]">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-foreground">{previewBooking.startTime} — {previewBooking.endTime}</span>
              </div>
              {previewBooking.serviceName && (
                <p className="text-[12px] text-text-secondary ml-5.5">{previewBooking.serviceName}</p>
              )}
              {previewBooking.clientId && clientMap[previewBooking.clientId] && (
                <div className="flex items-center gap-2 text-[13px]">
                  <div className="w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[7px] font-bold text-white">{clientMap[previewBooking.clientId][0]}</span>
                  </div>
                  <span className="text-foreground">{clientMap[previewBooking.clientId]}</span>
                </div>
              )}
              {previewBooking.notes && (
                <p className="text-[12px] text-text-tertiary mt-1">{previewBooking.notes}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { closePreview(); onBookingClick(previewBooking); }}
                className="flex-1 px-3 py-1.5 bg-foreground text-white rounded-lg text-[12px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
              >
                Edit
              </button>
              <button
                onClick={closePreview}
                className="px-3 py-1.5 bg-surface text-text-secondary rounded-lg text-[12px] font-medium cursor-pointer hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
