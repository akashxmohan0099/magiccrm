"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Booking, CalendarBlock, BlockKind } from "@/types/models";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QUICK_BLOCK_KINDS, REASON_BLOCK_KINDS, getBlockMeta } from "@/lib/blocks-meta";

interface CalendarViewProps {
  bookings: Booking[];
  onDateSelect: (date: string) => void;
  onBookingClick: (booking: Booking) => void;
  /** Drag-to-move on the day view. New start/end ISO strings (same date). */
  onBookingMove?: (booking: Booking, newStartAt: string, newEndAt: string) => void;
  onTimeSelect?: (date: string, startTime: string, endTime: string) => void;
  // Quick-create a block of the given kind. If openForm is true, the parent
  // should open the BlockForm so the user can fill out reason/recurrence —
  // used for "Blocked", "Unavailable", and "More options".
  onBlockCreate?: (
    date: string,
    startTime: string,
    endTime: string,
    kind: BlockKind,
    openForm: boolean
  ) => void;
  onBlockClick?: (block: CalendarBlock) => void;
  // When true, keep the drag-selection ghost visible (e.g. while a booking
  // or block form is open). Parent should flip this back to false once the
  // form is dismissed so the ghost clears.
  selectionVisible?: boolean;
}

type CalendarMode = "today" | "week" | "month";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
const PX_PER_HOUR = 64;
const WEEK_PX_PER_HOUR = 48;
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
  // Handle both ISO timestamps and HH:MM format
  if (time.includes("T")) {
    const d = new Date(time);
    return d.getHours() * 60 + d.getMinutes();
  }
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTimeDisplay(isoOrTime: string): string {
  if (isoOrTime.includes("T")) {
    const d = new Date(isoOrTime);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return isoOrTime;
}


function formatTimeLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary/20 border-primary/30 text-foreground",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-800",
  completed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  cancelled: "bg-red-50 border-red-200 text-red-500 line-through opacity-50",
  no_show: "bg-gray-100 border-gray-300 text-gray-500",
};

function getBookingStyle(b: Booking): string {
  return STATUS_STYLES[b.status] || STATUS_STYLES.confirmed;
}

export function CalendarView({
  bookings,
  onDateSelect,
  onBookingClick,
  onBookingMove,
  onTimeSelect,
  onBlockCreate,
  onBlockClick,
  selectionVisible = false,
}: CalendarViewProps) {
  const { clients } = useClientsStore();
  const { services } = useServicesStore();
  const { blocks } = useCalendarBlocksStore();
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

  // When the parent form closes (selectionVisible flips false), clear the
  // drag selection so the ghost block disappears with it.
  const prevSelectionVisible = useRef(selectionVisible);
  useEffect(() => {
    if (prevSelectionVisible.current && !selectionVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDragDateKey("");
      setDragDayIdx(-1);
      setDragStartMin(0);
      setDragEndMin(0);
    }
    prevSelectionVisible.current = selectionVisible;
  }, [selectionVisible]);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  const serviceMap = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [services]);

  const serviceObjMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const getBookingLabel = useCallback((b: Booking): string => {
    if (b.serviceId && serviceMap[b.serviceId]) return serviceMap[b.serviceId];
    return "Booking";
  }, [serviceMap]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => {
      const aMin = timeToMinutes(a.startAt);
      const bMin = timeToMinutes(b.startAt);
      return aMin - bMin;
    }));
    return map;
  }, [bookings]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, CalendarBlock[]> = {};
    blocks.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    }));
    return map;
  }, [blocks]);

  const getBlockLabel = useCallback((b: CalendarBlock): string => {
    if (b.label) return b.label;
    return getBlockMeta(b.kind).label;
  }, []);

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
        return `${week[0].toLocaleDateString("default", { month: "short", day: "numeric" })} —${week[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
      })()
    : currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // ── Drag handlers (shared by day + week) ──
  const getMinutesFromY = useCallback((clientY: number, ref: React.RefObject<HTMLDivElement | null>, pxPerHour?: number): number => {
    if (!ref.current) return MIN_MINUTES;
    const rect = ref.current.getBoundingClientRect();
    const y = clientY - rect.top + ref.current.scrollTop;
    const px = pxPerHour || PX_PER_HOUR;
    const totalMinutes = MIN_MINUTES + (y / px) * 60;
    const snapped = Math.round(totalMinutes / 15) * 15;
    return Math.max(MIN_MINUTES, Math.min(snapped, MIN_MINUTES + HOURS.length * 60));
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>, dateKey: string, dayIdx?: number) => {
    if (e.button !== 0) return;
    const pxPerHour = dayIdx !== undefined ? WEEK_PX_PER_HOUR : PX_PER_HOUR;
    const mins = getMinutesFromY(e.clientY, ref, pxPerHour);
    setIsDragging(true);
    setDragStartMin(mins);
    setDragEndMin(mins + 30);
    setDragDateKey(dateKey);
    setDragDayIdx(dayIdx ?? -1);
    setShowQuickAdd(false);
  }, [getMinutesFromY]);

  const moveDrag = useCallback((e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>, isWeek?: boolean) => {
    if (!isDragging) return;
    const pxPerHour = isWeek ? WEEK_PX_PER_HOUR : PX_PER_HOUR;
    const mins = getMinutesFromY(e.clientY, ref, pxPerHour);
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

  const createBookingFromDrag = useCallback(() => {
    const dateKey = dragDateKey || formatDateKey(currentDate);
    const start = Math.min(dragStartMin, dragEndMin);
    const end = Math.max(dragStartMin, dragEndMin);

    if (onTimeSelect) {
      onTimeSelect(dateKey, minutesToTime(start), minutesToTime(end));
    } else {
      onDateSelect(dateKey);
    }
    setShowQuickAdd(false);
  }, [currentDate, dragDateKey, dragStartMin, dragEndMin, onTimeSelect, onDateSelect]);

  const createBlockFromDrag = useCallback((kind: BlockKind, openForm: boolean) => {
    if (!onBlockCreate) return;
    const dateKey = dragDateKey || formatDateKey(currentDate);
    const start = Math.min(dragStartMin, dragEndMin);
    const end = Math.max(dragStartMin, dragEndMin);
    onBlockCreate(dateKey, minutesToTime(start), minutesToTime(end), kind, openForm);
    setShowQuickAdd(false);
  }, [currentDate, dragDateKey, dragStartMin, dragEndMin, onBlockCreate]);

  // Booking preview popup
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  // ── Day-view drag-to-move state ──
  // dragMove tracks the active drag; we offset the booking's rendered top
  // by `offsetMin` (snapped to 15-min increments) and commit on pointer up.
  // movedRef squelches the click handler when a drag actually happened, so
  // releasing the drag doesn't also open the booking detail.
  const [dragMove, setDragMove] = useState<{
    bookingId: string;
    originY: number;
    offsetMin: number;
  } | null>(null);
  const movedRef = useRef(false);

  const handleBookingPreview = useCallback((b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewBooking(b);
    setPreviewPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closePreview = useCallback(() => setPreviewBooking(null), []);

  const dragTop = ((Math.min(dragStartMin, dragEndMin) - MIN_MINUTES) / 60) * PX_PER_HOUR;
  const dragHeight = Math.max((Math.abs(dragEndMin - dragStartMin) / 60) * PX_PER_HOUR, 16);

  // WEEK_PX_PER_HOUR is now a module-level constant

  return (
    <div className="space-y-4">
      <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-2 sm:p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={next} className="p-2 sm:p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            <h3 className="text-sm font-semibold text-foreground ml-1">{headerLabel}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="text-xs font-medium text-text-secondary hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-surface cursor-pointer">Today</button>
            <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border-light">
              {(["today", "week", "month"] as CalendarMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === "today") setCurrentDate(new Date()); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${mode === m ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"}`}
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
          const dayBlocks = blocksByDate[dateKey] || [];
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
                      <div className="w-12 sm:w-16 flex-shrink-0 text-right pr-2 sm:pr-3 -mt-1.5">
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
                  <div className="absolute left-12 sm:left-16 right-0 flex items-center z-20 pointer-events-none" style={{ top: ((nowMinutes - MIN_MINUTES) / 60) * PX_PER_HOUR }}>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                )}

                {/* Drag ghost / selection block */}
                {(isDragging || showQuickAdd || selectionVisible) && dragDateKey === dateKey && (
                  <div
                    className={`absolute left-[56px] sm:left-[72px] right-3 rounded-lg z-10 pointer-events-none flex items-center justify-center ${
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

                {/* Calendar blocks (breaks, lunch, blocked, etc.) */}
                {dayBlocks.map((b) => {
                  const startMin = timeToMinutes(b.startTime);
                  const endMin = timeToMinutes(b.endTime);
                  const top = ((startMin - MIN_MINUTES) / 60) * PX_PER_HOUR;
                  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 24);
                  const meta = getBlockMeta(b.kind);
                  const Icon = meta.Icon;
                  const labelText = getBlockLabel(b);
                  return (
                    <button
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); onBlockClick?.(b); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`absolute left-[56px] sm:left-[72px] right-3 rounded-lg border px-3 py-1.5 cursor-pointer hover:shadow-md transition-shadow z-[4] ${meta.className}`}
                      style={{
                        top: Math.max(top, 0),
                        height,
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 6px, transparent 6px 12px)",
                      }}
                      title={b.reason ? `${labelText} — ${b.reason}` : labelText}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <p className="text-xs font-semibold truncate">{labelText}</p>
                      </div>
                      <p className="text-[11px] opacity-75 truncate">
                        {formatTimeDisplay(b.startTime)} – {formatTimeDisplay(b.endTime)}
                        {b.reason && !b.isPrivate ? ` · ${b.reason}` : ""}
                        {b.isRecurring ? " · repeats" : ""}
                      </p>
                    </button>
                  );
                })}

                {/* Booking blocks + buffer zones */}
                {dayBookings.filter(b => b.status !== "cancelled").map((b) => {
                  const startMin = timeToMinutes(b.startAt);
                  const endMin = timeToMinutes(b.endAt);
                  const top = ((startMin - MIN_MINUTES) / 60) * PX_PER_HOUR;
                  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 28);
                  const style = getBookingStyle(b);
                  const label = getBookingLabel(b);
                  const startDisplay = formatTimeDisplay(b.startAt);
                  const endDisplay = formatTimeDisplay(b.endAt);
                  const svcName = b.serviceId ? serviceMap[b.serviceId] : undefined;
                  const svcObj = b.serviceId ? serviceObjMap.get(b.serviceId) : undefined;
                  const bufferMins = svcObj?.bufferMinutes || 0;

                  return (
                    <div key={b.id}>
                    {/* Buffer zone after booking */}
                    {bufferMins > 0 && (
                      <div
                        className="absolute left-[56px] sm:left-[72px] right-3 rounded-b-lg bg-foreground/[0.04] border border-dashed border-border-light z-[2] flex items-center justify-center"
                        style={{ top: Math.max(top, 0) + height, height: (bufferMins / 60) * PX_PER_HOUR }}
                      >
                        <span className="text-[9px] text-text-tertiary">Buffer {bufferMins}m</span>
                      </div>
                    )}
                    <button
                      key={b.id}
                      onClick={(e) => {
                        if (movedRef.current) {
                          // Drag just released; consume the synthetic click.
                          movedRef.current = false;
                          e.preventDefault();
                          return;
                        }
                        handleBookingPreview(b, e);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        if (!onBookingMove) return;
                        // Drag-to-move: capture the pointer, freeze origin.
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setDragMove({ bookingId: b.id, originY: e.clientY, offsetMin: 0 });
                        movedRef.current = false;
                      }}
                      onPointerMove={(e) => {
                        if (!dragMove || dragMove.bookingId !== b.id) return;
                        const deltaPx = e.clientY - dragMove.originY;
                        // PX_PER_HOUR = 64 → 1 minute = 64/60 px. Snap to 15.
                        const rawMin = (deltaPx * 60) / PX_PER_HOUR;
                        const snapped = Math.round(rawMin / 15) * 15;
                        if (snapped !== dragMove.offsetMin) {
                          setDragMove({ ...dragMove, offsetMin: snapped });
                        }
                        if (Math.abs(deltaPx) > 4) movedRef.current = true;
                      }}
                      onPointerUp={() => {
                        if (!dragMove || dragMove.bookingId !== b.id) return;
                        const offset = dragMove.offsetMin;
                        setDragMove(null);
                        if (offset !== 0 && onBookingMove) {
                          // Compute new ISO timestamps; clamp to day window.
                          const startD = new Date(b.startAt);
                          const endD = new Date(b.endAt);
                          const newStart = new Date(startD.getTime() + offset * 60000);
                          const newEnd = new Date(endD.getTime() + offset * 60000);
                          onBookingMove(b, newStart.toISOString(), newEnd.toISOString());
                        }
                      }}
                      onPointerCancel={() => setDragMove(null)}
                      className={`absolute left-[56px] sm:left-[72px] right-3 rounded-lg border px-3 py-1.5 cursor-pointer hover:shadow-md transition-shadow z-[5] ${style} ${
                        dragMove?.bookingId === b.id ? "shadow-xl ring-2 ring-primary/40" : ""
                      }`}
                      style={{
                        top:
                          Math.max(top, 0) +
                          (dragMove?.bookingId === b.id
                            ? (dragMove.offsetMin / 60) * PX_PER_HOUR
                            : 0),
                        height,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate">{label}</p>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">
                        {startDisplay} – {endDisplay}
                        {svcName ? ` · ${svcName}` : ""}
                        {b.clientId && clientMap[b.clientId] ? ` · ${clientMap[b.clientId]}` : ""}
                      </p>
                    </button>
                    </div>
                  );
                })}
              </div>

              {/* Empty day */}
              {dayBookings.length === 0 && !isDragging && !showQuickAdd && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-card-bg/90 rounded-xl px-6 py-4 pointer-events-auto">
                    <p className="text-[13px] text-text-tertiary mb-2">Drag to add an appointment</p>
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
            <div className="select-none overflow-x-auto">
             <div className="min-w-[600px]">
              {/* Day headers -- double-click to go to day view */}
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
                      <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              {/* Time grid with drag */}
              <div
                ref={weekGridRef}
                className="relative"
                style={{ height: HOURS.length * WEEK_PX_PER_HOUR }}
                onMouseMove={(e) => moveDrag(e, weekGridRef, true)}
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
                {(isDragging || showQuickAdd || selectionVisible) && dragDayIdx >= 0 && (
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

                {/* Calendar blocks */}
                {weekDays.map((d, dayIdx) => {
                  const dk = formatDateKey(d);
                  const dayBlocks = blocksByDate[dk] || [];
                  return dayBlocks.map((b) => {
                    const startMin = timeToMinutes(b.startTime);
                    const endMin = timeToMinutes(b.endTime);
                    const top = ((startMin - MIN_MINUTES) / 60) * WEEK_PX_PER_HOUR;
                    const height = Math.max(((endMin - startMin) / 60) * WEEK_PX_PER_HOUR, 18);
                    const meta = getBlockMeta(b.kind);
                    const Icon = meta.Icon;
                    return (
                      <button
                        key={b.id}
                        onClick={(e) => { e.stopPropagation(); onBlockClick?.(b); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`absolute rounded border px-1 py-0.5 cursor-pointer text-left overflow-hidden hover:shadow-sm transition-shadow z-[1] ${meta.className}`}
                        style={{
                          top: Math.max(top, 0), height,
                          left: `calc(48px + (${dayIdx} * (100% - 48px) / 7) + 2px)`,
                          width: `calc((100% - 48px) / 7 - 4px)`,
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 6px, transparent 6px 12px)",
                        }}
                        title={b.reason ? `${getBlockLabel(b)} — ${b.reason}` : getBlockLabel(b)}
                      >
                        <p className="text-[10px] font-semibold truncate flex items-center gap-1">
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          {getBlockLabel(b)}
                        </p>
                      </button>
                    );
                  });
                })}

                {/* Booking blocks */}
                {weekDays.map((d, dayIdx) => {
                  const dk = formatDateKey(d);
                  const dayBookings = (bookingsByDate[dk] || []).filter(b => b.status !== "cancelled");
                  return dayBookings.map((b) => {
                    const startMin = timeToMinutes(b.startAt);
                    const endMin = timeToMinutes(b.endAt);
                    const top = ((startMin - MIN_MINUTES) / 60) * WEEK_PX_PER_HOUR;
                    const height = Math.max(((endMin - startMin) / 60) * WEEK_PX_PER_HOUR, 22);
                    const style = getBookingStyle(b);
                    const label = getBookingLabel(b);
                    const startDisplay = formatTimeDisplay(b.startAt);
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
                        <p className="text-[10px] font-semibold truncate">{label}</p>
                        {height > 28 && <p className="text-[9px] text-text-secondary truncate">{startDisplay}</p>}
                      </button>
                    );
                  });
                })}
              </div>
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
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-7 border-b border-border-light">
                  {DAY_LABELS.map((l) => <div key={l} className="text-center text-[11px] font-medium text-text-tertiary py-2">{l}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map(({ day, dateKey, inMonth }, idx) => {
                    const dayBookings = bookingsByDate[dateKey] || [];
                    const dayBlocks = blocksByDate[dateKey] || [];
                    const isToday = dateKey === todayKey;
                    const items: { id: string; type: "booking" | "block"; sortMin: number; render: React.ReactNode }[] = [];
                    dayBookings.forEach((b) => items.push({
                      id: `booking-${b.id}`,
                      type: "booking",
                      sortMin: timeToMinutes(b.startAt),
                      render: (
                        <div key={`booking-${b.id}`} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${getBookingStyle(b)}`}>
                          {`${formatTimeDisplay(b.startAt)} ${getBookingLabel(b)}`}
                        </div>
                      ),
                    }));
                    dayBlocks.forEach((b) => {
                      const m = getBlockMeta(b.kind);
                      const Icon = m.Icon;
                      items.push({
                        id: `block-${b.id}`,
                        type: "block",
                        sortMin: timeToMinutes(b.startTime),
                        render: (
                          <div key={`block-${b.id}`} className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${m.className}`}>
                            <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{getBlockLabel(b)}</span>
                          </div>
                        ),
                      });
                    });
                    items.sort((a, b) => a.sortMin - b.sortMin);
                    return (
                      <button key={idx} onClick={() => { setCurrentDate(new Date(dateKey + "T00:00:00")); setMode("today"); }} className={`relative min-h-[80px] p-1.5 text-left border-b border-r border-border-light transition-colors cursor-pointer ${!inMonth ? "bg-surface/30" : "hover:bg-surface/50"}`}>
                        <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? "bg-foreground text-background" : inMonth ? "text-foreground" : "text-text-tertiary/40"}`}>{day}</span>
                        <div className="mt-0.5 space-y-0.5">
                          {items.slice(0, 2).map((it) => it.render)}
                          {items.length > 2 && <p className="text-[10px] text-text-tertiary px-1.5">+{items.length - 2} more</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Quick add popup (shared by day + week drag) */}
      {showQuickAdd && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setShowQuickAdd(false)} />
          <div
            className="fixed z-[95] bg-card-bg rounded-xl border border-border-light shadow-xl p-1.5 min-w-[260px]"
            style={{ left: Math.min(quickAddPos.x, window.innerWidth - 280), top: Math.min(quickAddPos.y, window.innerHeight - 460) }}
          >
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2.5 py-1.5">
              {minutesToTime(Math.min(dragStartMin, dragEndMin))} — {minutesToTime(Math.max(dragStartMin, dragEndMin))}
            </p>

            <button
              onClick={() => createBookingFromDrag()}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left"
            >
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-medium text-foreground">New Appointment</span>
            </button>

            {onBlockCreate && (
              <>
                <div className="my-1 border-t border-border-light" />
                {QUICK_BLOCK_KINDS.map((k) => {
                  const m = getBlockMeta(k);
                  const Icon = m.Icon;
                  return (
                    <button
                      key={k}
                      onClick={() => createBlockFromDrag(k, false)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left"
                    >
                      <Icon className={`w-4 h-4 ${m.iconClassName}`} />
                      <span className="text-[13px] font-medium text-foreground">{m.label}</span>
                    </button>
                  );
                })}

                <div className="my-1 border-t border-border-light" />
                {REASON_BLOCK_KINDS.map((k) => {
                  const m = getBlockMeta(k);
                  const Icon = m.Icon;
                  return (
                    <button
                      key={k}
                      onClick={() => createBlockFromDrag(k, true)}
                      className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${m.iconClassName}`} />
                        <span className="text-[13px] font-medium text-foreground">{m.label}</span>
                      </span>
                      <span className="text-[10px] text-text-tertiary">with reason</span>
                    </button>
                  );
                })}

                <div className="my-1 border-t border-border-light" />
                <button
                  onClick={() => createBlockFromDrag("custom", true)}
                  className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left"
                >
                  <span className="text-[13px] font-medium text-foreground">More options</span>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
              </>
            )}
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
                  <p className="text-[15px] font-semibold text-foreground">
                    {getBookingLabel(previewBooking)}
                  </p>
                </div>
                <p className="text-xs text-text-secondary">
                  {new Date(previewBooking.date + "T00:00:00").toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
              <StatusBadge status={previewBooking.status} />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-[13px]">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-foreground">{formatTimeDisplay(previewBooking.startAt)} — {formatTimeDisplay(previewBooking.endAt)}</span>
              </div>
              {previewBooking.serviceId && serviceMap[previewBooking.serviceId] && (
                <p className="text-xs text-text-secondary ml-5.5">{serviceMap[previewBooking.serviceId]}</p>
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
                <p className="text-xs text-text-tertiary mt-1">{previewBooking.notes}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { closePreview(); onBookingClick(previewBooking); }}
                className="flex-1 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
              >
                View Details
              </button>
              <button
                onClick={closePreview}
                className="px-3 py-1.5 bg-surface text-text-secondary rounded-lg text-xs font-medium cursor-pointer hover:text-foreground transition-colors"
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
