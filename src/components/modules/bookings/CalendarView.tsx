"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Booking } from "@/types/models";
import { useClientsStore } from "@/store/clients";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CalendarViewProps {
  bookings: Booking[];
  onDateSelect: (date: string) => void;
  onBookingClick: (booking: Booking) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView({ bookings, onDateSelect, onBookingClick }: CalendarViewProps) {
  const { clients } = useClientsStore();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; dateKey: string; inMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({ day: d, dateKey: formatDateKey(y, m, d), inMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, dateKey: formatDateKey(year, month, d), inMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({ day: d, dateKey: formatDateKey(y, m, d), inMonth: false });
    }

    return days;
  }, [year, month]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey);
  };

  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] ?? []) : [];

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-semibold text-foreground">{monthLabel}</h3>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border-light">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-text-secondary py-2"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map(({ day, dateKey, inMonth }, idx) => {
            const count = (bookingsByDate[dateKey] ?? []).length;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(dateKey)}
                className={`relative h-16 p-1.5 text-left border-b border-r border-border-light transition-colors cursor-pointer ${
                  !inMonth
                    ? "text-text-secondary/40 bg-surface/30"
                    : isSelected
                    ? "bg-surface"
                    : "hover:bg-surface"
                }`}
              >
                <span
                  className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday
                      ? "bg-foreground text-white"
                      : inMonth
                      ? "text-foreground"
                      : "text-text-secondary/40"
                  }`}
                >
                  {day}
                </span>
                {count > 0 && inMonth && (
                  <div className="flex gap-0.5 mt-0.5 px-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-foreground"
                      />
                    ))}
                    {count > 3 && (
                      <span className="text-[10px] text-text-secondary ml-0.5">
                        +{count - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Bookings */}
      {selectedDate && (
        <div className="bg-card-bg rounded-xl border border-border-light p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h4>
            <button
              onClick={() => onDateSelect(selectedDate)}
              className="text-xs font-medium text-foreground hover:underline cursor-pointer"
            >
              + Add booking
            </button>
          </div>

          {selectedBookings.length === 0 ? (
            <p className="text-sm text-text-secondary">No bookings for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-light hover:bg-surface transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.title}</p>
                    <p className="text-xs text-text-secondary">
                      {b.startTime} – {b.endTime}
                      {b.clientId && clientMap[b.clientId]
                        ? ` · ${clientMap[b.clientId]}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
