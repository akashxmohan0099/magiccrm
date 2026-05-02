"use client";

import { useMemo, useState } from "react";
import { CalendarOff, ChevronDown, ExternalLink, PartyPopper, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { AvailabilitySettings } from "@/components/modules/bookings/AvailabilitySettings";
import { useSettingsStore } from "@/store/settings";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface PublicHolidaySuggestion {
  date: string;
  name: string;
  note?: string;
}

const QUEENSLAND_PUBLIC_HOLIDAYS: PublicHolidaySuggestion[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-26", name: "Australia Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-04", name: "The day after Good Friday" },
  { date: "2026-04-05", name: "Easter Sunday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-04-25", name: "Anzac Day" },
  { date: "2026-05-04", name: "Labour Day" },
  { date: "2026-08-12", name: "Royal Queensland Show", note: "Brisbane area only" },
  { date: "2026-10-05", name: "King's Birthday" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-26", name: "Boxing Day" },
  { date: "2026-12-28", name: "Additional public holiday for Boxing Day" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-01-26", name: "Australia Day" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-03-27", name: "The day after Good Friday" },
  { date: "2027-03-28", name: "Easter Sunday" },
  { date: "2027-03-29", name: "Easter Monday" },
  { date: "2027-04-26", name: "Anzac Day" },
  { date: "2027-05-03", name: "Labour Day" },
  { date: "2027-08-11", name: "Royal Queensland Show", note: "Brisbane area only" },
  { date: "2027-10-04", name: "King's Birthday" },
  { date: "2027-12-25", name: "Christmas Day" },
  { date: "2027-12-26", name: "Boxing Day" },
  { date: "2027-12-27", name: "Additional public holiday for Christmas Day" },
  { date: "2027-12-28", name: "Additional public holiday for Boxing Day" },
];

const TIME_OFF_KINDS = new Set(["vacation", "holiday", "unavailable", "sick"]);

/**
 * Calendar-scoped settings drawer. Surfaces the rules an operator most
 * often wants to tweak from inside the calendar view, without sending them
 * to /settings. Writes go through the canonical stores so the same fields
 * stay in lockstep wherever they're rendered.
 *
 * Sections:
 *   - Working hours (reuses AvailabilitySettings — workspace/per-staff toggle)
 *   - Booking window (min notice, max advance)
 *   - Time off (upcoming all-day closures; quick-add)
 *   - Buffer time (link out — buffers live per-service in /services)
 */
export function CalendarSettingsSlideOver({ open, onClose }: Props) {
  return (
    <SlideOver open={open} onClose={onClose} title="Calendar settings">
      <div className="space-y-8">
        <Section
          title="Working hours"
          description="The default weekly hours your business is open. Per-staff overrides can be set here too."
        >
          <AvailabilitySettings />
        </Section>

        <Section
          title="Booking window"
          description="When clients can book online — how soon and how far out."
        >
          <BookingWindowEditor />
        </Section>

        <Section
          title="Time off"
          description="One-off closures (a public holiday, a week away). Shows up as unavailable on the calendar."
        >
          <TimeOffEditor />
        </Section>

        <Section
          title="Buffer time"
          description="Padding between bookings is configured per service."
        >
          <Link
            href="/dashboard/services"
            className="inline-flex items-center gap-1.5 text-[13px] text-foreground hover:underline"
          >
            Open services
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Section>
      </div>
    </SlideOver>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-[13px] text-text-secondary mt-0.5 mb-3">{description}</p>
      {children}
    </section>
  );
}

// ── Booking window ───────────────────────────────────

function BookingWindowEditor() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { workspaceId } = useAuth();

  const [minNotice, setMinNotice] = useState<number>(settings?.minNoticeHours ?? 4);
  const [maxAdvance, setMaxAdvance] = useState<number>(settings?.maxAdvanceDays ?? 56);
  const [saved, setSaved] = useState(false);

  const dirty =
    minNotice !== (settings?.minNoticeHours ?? 4) ||
    maxAdvance !== (settings?.maxAdvanceDays ?? 56);

  function save() {
    updateSettings(
      { minNoticeHours: minNotice, maxAdvanceDays: maxAdvance },
      workspaceId ?? undefined,
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="bg-card-bg rounded-xl border border-border-light p-4 space-y-3">
      <Field
        label="Minimum notice"
        suffix="hours before booking"
        value={minNotice}
        min={0}
        max={168}
        onChange={setMinNotice}
        hint="Block last-minute bookings — clients must book at least this many hours ahead."
      />
      <Field
        label="Maximum advance"
        suffix="days ahead"
        value={maxAdvance}
        min={1}
        max={365}
        onChange={setMaxAdvance}
        hint="Stops clients booking too far out (8 weeks is a common default)."
      />
      <div className="flex items-center gap-3 pt-1">
        <Button size="sm" variant="primary" onClick={save} disabled={!dirty}>
          Save window
        </Button>
        {saved && <span className="text-[12px] text-foreground font-medium">Saved!</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  suffix,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[13px] font-medium text-foreground">
        <span className="w-36">{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="w-20 px-2 py-1 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40"
        />
        <span className="text-[13px] text-text-secondary">{suffix}</span>
      </label>
      {hint && <p className="ml-36 mt-1 text-[12px] text-text-tertiary">{hint}</p>}
    </div>
  );
}

// ── Time off ─────────────────────────────────────────

function TimeOffEditor() {
  const blocks = useCalendarBlocksStore((s) => s.blocks);
  const addBlock = useCalendarBlocksStore((s) => s.addBlock);
  const deleteBlock = useCalendarBlocksStore((s) => s.deleteBlock);
  const { workspaceId } = useAuth();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [holidaysOpen, setHolidaysOpen] = useState(false);

  // Local "today" — toISOString().slice(0,10) returns UTC date, which can
  // be off-by-one for evening/morning users in non-UTC zones.
  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  // Upcoming all-day-ish closures: kind in {vacation, holiday, unavailable, sick}
  // and date >= today. Sort soonest first.
  const upcoming = useMemo(() => {
    return blocks
      .filter((b) => TIME_OFF_KINDS.has(b.kind) && b.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [blocks, todayStr]);

  const suggestedHolidays = useMemo(() => {
    const closedDates = new Set(
      blocks.filter((b) => TIME_OFF_KINDS.has(b.kind)).map((b) => b.date),
    );

    return QUEENSLAND_PUBLIC_HOLIDAYS.filter(
      (holiday) => holiday.date >= todayStr && !closedDates.has(holiday.date),
    );
  }, [blocks, todayStr]);

  function addHoliday(holiday: PublicHolidaySuggestion) {
    addBlock(
      {
        workspaceId: workspaceId || "",
        teamMemberId: undefined,
        kind: "holiday",
        date: holiday.date,
        startTime: `${holiday.date}T00:00:00`,
        endTime: `${holiday.date}T23:59:00`,
        isPrivate: false,
        isRecurring: false,
        label: holiday.name,
        reason: holiday.note ? `Public holiday - ${holiday.note}` : "Public holiday",
      },
      workspaceId ?? undefined,
    );
    toast(`Added ${holiday.name}`);
  }

  function addAllSuggestedHolidays() {
    for (const holiday of suggestedHolidays) {
      addBlock(
        {
          workspaceId: workspaceId || "",
          teamMemberId: undefined,
          kind: "holiday",
          date: holiday.date,
          startTime: `${holiday.date}T00:00:00`,
          endTime: `${holiday.date}T23:59:00`,
          isPrivate: false,
          isRecurring: false,
          label: holiday.name,
          reason: holiday.note ? `Public holiday - ${holiday.note}` : "Public holiday",
        },
        workspaceId ?? undefined,
      );
    }
    toast(`Added ${suggestedHolidays.length} public holidays`);
  }

  function add() {
    if (!start) return;
    const endDate = end || start;
    if (endDate < start) {
      toast("End date can't be before start", "error");
      return;
    }

    // Walk each day in the range using UTC arithmetic (so DST never shifts
    // the iteration) and persist times as wall-clock ISO strings (no Z, no
    // round-trip through Date#toISOString) — readers across the app
    // interpret these as workspace-local time.
    const days: string[] = [];
    {
      const [sy, sm, sd] = start.split("-").map(Number);
      const [ey, em, ed] = endDate.split("-").map(Number);
      const cursor = new Date(Date.UTC(sy, sm - 1, sd));
      const last = new Date(Date.UTC(ey, em - 1, ed));
      while (cursor.getTime() <= last.getTime()) {
        days.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    for (const d of days) {
      addBlock(
        {
          workspaceId: workspaceId || "",
          teamMemberId: undefined,
          kind: "vacation",
          date: d,
          startTime: `${d}T00:00:00`,
          endTime: `${d}T23:59:00`,
          isPrivate: false,
          isRecurring: false,
          label: reason || "Time off",
          reason: reason || undefined,
        },
        workspaceId ?? undefined,
      );
    }

    toast(days.length === 1 ? "Time off added" : `Time off added (${days.length} days)`);
    setStart("");
    setEnd("");
    setReason("");
  }

  return (
    <div className="space-y-3">
      <div className="bg-card-bg rounded-xl border border-border-light p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={start}
            min={todayStr}
            onChange={(e) => setStart(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40"
          />
          <span className="text-[12px] text-text-secondary">to</span>
          <input
            type="date"
            value={end}
            min={start || todayStr}
            onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40"
          />
          <input
            type="text"
            value={reason}
            placeholder="Reason (optional)"
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 min-w-[140px] px-2 py-1.5 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40"
          />
        </div>
        <Button size="sm" variant="primary" onClick={add} disabled={!start}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add time off
        </Button>
      </div>

      <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setHolidaysOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface transition-colors"
          aria-expanded={holidaysOpen}
        >
          <span className="flex items-center gap-2 min-w-0">
            <PartyPopper className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-foreground truncate">
                Suggested public holidays
              </span>
              <span className="block text-[11px] text-text-tertiary truncate">
                Queensland, including Brisbane show day
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-text-tertiary">
              {suggestedHolidays.length} left
            </span>
            <ChevronDown
              className={`w-4 h-4 text-text-tertiary transition-transform ${
                holidaysOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {holidaysOpen && (
          <div className="border-t border-border-light">
            {suggestedHolidays.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-surface/60">
                  <p className="text-[11px] text-text-tertiary">
                    Add them as full-day closures.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={addAllSuggestedHolidays}
                    className="px-3 py-1.5 text-[11px]"
                  >
                    Add all
                  </Button>
                </div>
                <ul className="divide-y divide-border-light">
                  {suggestedHolidays.map((holiday) => (
                    <li
                      key={holiday.date}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] text-foreground truncate">{holiday.name}</p>
                        <p className="text-[11px] text-text-tertiary truncate">
                          {formatDateLabel(holiday.date)}
                          {holiday.note ? ` - ${holiday.note}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => addHoliday(holiday)}
                        className="px-3 py-1.5 text-[11px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="px-4 py-3 text-[12px] text-text-tertiary">
                All suggested public holidays are already closed.
              </p>
            )}
          </div>
        )}
      </div>

      {upcoming.length > 0 ? (
        <ul className="bg-card-bg border border-border-light rounded-xl divide-y divide-border-light">
          {upcoming.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarOff className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] text-foreground truncate">
                    {formatDateLabel(b.date)}
                  </p>
                  {b.label && (
                    <p className="text-[11px] text-text-tertiary truncate">{b.label}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteBlock(b.id, workspaceId ?? undefined)}
                className="p-1 text-text-tertiary hover:text-red-500 rounded transition-colors"
                aria-label="Remove time off"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-text-tertiary px-1">No upcoming time off.</p>
      )}
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
