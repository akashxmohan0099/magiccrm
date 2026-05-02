"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Basket item the picker forwards to the server. Mirrors `BasketItemRequest`
 * in `lib/server/public-booking.ts`. Defined here as a structural type so
 * the public component doesn't pull in a `server-only` module.
 */
export interface TimePickerBasketItem {
  serviceId: string;
  variantId?: string;
  /** Sum of selected addon durations for this item (minutes). */
  extraDurationMinutes?: number;
  preferredMemberId?: string;
}

interface TimePickerProps {
  slug: string;
  /** Full cart. Single-item carts hit the legacy single-service endpoint
   *  (faster, fewer DB hits). 2+ items hit the basket endpoint that runs
   *  the same engine the submit handler uses, so the returned slots match
   *  what will actually pass validation. */
  basketItems: TimePickerBasketItem[];
  /** Total contiguous duration for single-item fallback. Ignored when
   *  basketItems has 2+ entries — the server computes that itself. */
  durationMinutes: number;
  /** ISO weekdays (0 = Sunday) where the workspace is open. Drives the date strip. */
  enabledWeekdays: Set<number>;
  /** Earliest date the cart is bookable. Derived from per-service minNoticeHours.
   *  Anything before this is disabled in the strip. */
  minDate?: Date;
  /** Latest date the cart is bookable. Derived from per-service maxAdvanceDays.
   *  Anything after this is disabled. */
  maxDate?: Date;
  selectedDate: string | null;
  selectedTime: string | null;
  onChange: (next: { date: string | null; time: string | null }) => void;
  /** Filter slots to members allowed at this location. Omitted = no filter. */
  locationId?: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

export function TimePicker({
  slug,
  basketItems,
  durationMinutes,
  enabledWeekdays,
  minDate,
  maxDate,
  selectedDate,
  selectedTime,
  onChange,
  locationId,
}: TimePickerProps) {
  // Stable serialised cart for the effect dep list. React's referential
  // equality on basketItems would re-fetch on every parent render; the
  // serialised form only changes when the cart actually changes.
  const basketKey = useMemo(() => {
    return basketItems
      .map(
        (b) =>
          `${b.serviceId}|${b.variantId ?? ""}|${b.extraDurationMinutes ?? 0}|${b.preferredMemberId ?? ""}`,
      )
      .join("~");
  }, [basketItems]);
  const primaryServiceId = basketItems[0]?.serviceId ?? "";
  const [stripStart, setStripStart] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 14-day window starting from stripStart.
  const dateStrip = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(stripStart);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, [stripStart]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Fetch slots when date or basket changes. Two paths:
  //   - Single-item cart: hit the legacy GET /book/info endpoint (cheaper,
  //     keeps the old public flow unchanged).
  //   - Multi-item cart: POST to /availability/basket so the server
  //     validates EVERY item against members + resources + buffers. This
  //     closes the gap where the old single-service estimate would show
  //     times the submit handler later rejected.
  useEffect(() => {
    if (!selectedDate || basketItems.length === 0 || durationMinutes <= 0) {
      return () => undefined;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate fetch trigger
    setLoadingSlots(true);

    const fetchPromise =
      basketItems.length === 1
        ? (() => {
            const locParam = locationId
              ? `&locationId=${encodeURIComponent(locationId)}`
              : "";
            return fetch(
              `/api/public/book/info?slug=${encodeURIComponent(slug)}&bookingsDate=${selectedDate}&serviceId=${primaryServiceId}&durationMinutes=${durationMinutes}${locParam}`,
            )
              .then((r) => r.json())
              .then((data) =>
                Array.isArray(data.availableSlots) ? (data.availableSlots as string[]) : [],
              );
          })()
        : fetch(`/api/public/availability/basket`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              slug,
              date: selectedDate,
              items: basketItems,
              locationId,
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (!Array.isArray(data.slots)) return [] as string[];
              return data.slots.map(
                (s: { time: string }) => s.time,
              );
            });

    fetchPromise
      .then((times) => {
        if (cancelled) return;
        setSlots(times);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
    // basketKey captures every basket field; primaryServiceId / durationMinutes
    // are derived from it. The exhaustive-deps lint is satisfied by listing
    // basketKey explicitly.
  }, [slug, selectedDate, basketKey, primaryServiceId, durationMinutes, locationId, basketItems]);

  // When the date is cleared, drop any stale slots so the UI doesn't flash.
  const displaySlots =
    selectedDate && basketItems.length > 0 && durationMinutes > 0 ? slots : [];

  const isDateEnabled = (d: Date) => {
    if (d < today) return false;
    // Per-service min-notice (e.g. "must book 24hrs ahead") narrows the
    // earliest allowed date. minDate is already date-only (00:00) so the
    // direct comparison works.
    if (minDate && d < minDate) return false;
    // Per-service max-advance (e.g. "can't book more than 60 days out").
    if (maxDate && d > maxDate) return false;
    return enabledWeekdays.has(d.getDay());
  };

  const handleDateClick = (d: Date) => {
    if (!isDateEnabled(d)) return;
    onChange({ date: fmtDateISO(d), time: null });
  };

  const shiftStrip = (days: number) => {
    const next = new Date(stripStart);
    next.setDate(next.getDate() + days);
    if (next < today) return;
    setStripStart(next);
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Pick a date</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftStrip(-7)}
              aria-label="Earlier dates"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-foreground hover:bg-surface cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={stripStart <= today}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftStrip(7)}
              aria-label="Later dates"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-foreground hover:bg-surface cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dateStrip.map((d) => {
            const iso = fmtDateISO(d);
            const enabled = isDateEnabled(d);
            const selected = iso === selectedDate;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => handleDateClick(d)}
                disabled={!enabled}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-center transition-colors ${
                  selected
                    ? "bg-foreground text-background"
                    : enabled
                    ? "bg-surface text-foreground hover:bg-surface/70 cursor-pointer"
                    : "bg-surface/50 text-text-tertiary/40 cursor-not-allowed"
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                  {DAY_LABELS[d.getDay()]}
                </span>
                <span className="text-[15px] font-bold tabular-nums">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Pick a time</p>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
            </div>
          ) : displaySlots.length === 0 ? (
            <div className="bg-surface border border-border-light rounded-xl p-6 text-center">
              <p className="text-[13px] font-medium text-foreground">No openings on this day</p>
              <p className="text-[12px] text-text-tertiary mt-1">Try a different date — your selected services may need a longer continuous window.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 sm:grid-cols-4 gap-2"
            >
              {displaySlots.map((time) => {
                const selected = time === selectedTime;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onChange({ date: selectedDate, time })}
                    aria-pressed={selected}
                    className={`px-2.5 py-2 rounded-lg text-[13px] font-medium tabular-nums transition-colors cursor-pointer ${
                      selected
                        ? "bg-foreground text-background"
                        : "bg-surface text-foreground hover:bg-surface/70"
                    }`}
                  >
                    {fmtTime12h(time)}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </section>
  );
}
