"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import type { Suggestion } from "@/types/models";
import { useAuth } from "@/hooks/useAuth";
import { useBookingsStore } from "@/store/bookings";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { useTeamStore } from "@/store/team";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { useSettingsStore } from "@/store/settings";
import { useSuggestionsStore, selectActiveSuggestions } from "@/store/suggestions";
import { computeUtilization } from "@/lib/calendar/utilization";
import { runSuggestions } from "@/lib/calendar/suggestions";
import { nextAvailableSlots } from "@/lib/calendar/next-available";
import { OutlookCard } from "./OutlookCard";
import { RevenueCard } from "./RevenueCard";
import { SuggestionsCard } from "./SuggestionsCard";
import { SuggestionPreviewModal } from "./SuggestionPreviewModal";
import { CalendarSettingsSlideOver } from "./CalendarSettingsSlideOver";
import { Settings as SettingsIcon, ChevronRight } from "lucide-react";

interface Props {
  /** When provided, restricts utilisation calc to this single member. */
  filterMemberId?: string;
  /**
   * When `filterMemberId` is set, also include bookings with no assignee.
   * Owners see those because they're the ones who triage them.
   */
  includeUnassigned?: boolean;
  /** Calendar date currently shown in the grid. Rail metrics follow this week. */
  visibleDate: Date;
  visibleMode: "today" | "week" | "month";
  /** Navigate the calendar to a specific date (week-jump on secondary action). */
  onNavigateToDate?: (date: string) => void;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay()); // Sunday
  return out;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function sameDate(a: Date, b: Date): boolean {
  return ymd(a) === ymd(b);
}

function formatWeekLabel(start: Date, end: Date, visibleMode: Props["visibleMode"]): string {
  if (visibleMode === "month") return "Selected week";
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

export function CalendarRail({ filterMemberId, includeUnassigned, visibleDate, visibleMode, onNavigateToDate }: Props) {
  const { workspaceId } = useAuth();
  const bookings = useBookingsStore((s) => s.bookings);
  const blocks = useCalendarBlocksStore((s) => s.blocks);
  const members = useTeamStore((s) => s.members);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);
  const settings = useSettingsStore((s) => s.settings);

  const { setGenerated, pruneOverrides, dismiss } = useSuggestionsStore(
    useShallow((s) => ({
      setGenerated: s.setGenerated,
      pruneOverrides: s.pruneOverrides,
      dismiss: s.dismiss,
    })),
  );
  const generated = useSuggestionsStore((s) => s.generated);
  const overrides = useSuggestionsStore((s) => s.overrides);
  const activeSuggestions = useMemo(
    () => selectActiveSuggestions({ generated, overrides }),
    [generated, overrides],
  );

  const [previewSuggestion, setPreviewSuggestion] = useState<Suggestion | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filteredMembers = useMemo(
    () => (filterMemberId ? members.filter((m) => m.id === filterMemberId) : members),
    [members, filterMemberId],
  );
  const filteredBookings = useMemo(() => {
    if (!filterMemberId) return bookings;
    return bookings.filter((b) => {
      if (b.assignedToId === filterMemberId) return true;
      if (includeUnassigned && !b.assignedToId) return true;
      return false;
    });
  }, [bookings, filterMemberId, includeUnassigned]);

  const { weekly, today, comparisonRevenue, nextAvail, now, weekLabel, showToday, todayDate, weekStartDate } = useMemo(() => {
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const targetWeekStart = startOfWeek(visibleDate);
    const targetWeekEnd = shiftDays(targetWeekStart, 6);
    const compWeekStart = shiftDays(targetWeekStart, -7);
    const compWeekEnd = shiftDays(compWeekStart, 6);
    const todayStr = ymd(now);
    const showToday = sameDate(targetWeekStart, currentWeekStart);
    const weekLabel = showToday
      ? "This week"
      : formatWeekLabel(targetWeekStart, targetWeekEnd, visibleMode);

    const baseInput = {
      workspaceWorkingHours: settings?.workingHours ?? {},
      members: filteredMembers,
      bookings: filteredBookings,
      blocks,
      services,
    };

    const weekly = computeUtilization({
      startDate: ymd(targetWeekStart),
      endDate: ymd(targetWeekEnd),
      ...baseInput,
    });
    const today = computeUtilization({
      startDate: todayStr,
      endDate: todayStr,
      ...baseInput,
      avgServiceDurationMin: weekly.avgServiceDurationMin,
      revenuePerMinute: weekly.revenuePerMinute,
    });
    const comparison = computeUtilization({
      startDate: ymd(compWeekStart),
      endDate: ymd(compWeekEnd),
      ...baseInput,
      avgServiceDurationMin: weekly.avgServiceDurationMin,
      revenuePerMinute: weekly.revenuePerMinute,
    });

    const nextAvail = nextAvailableSlots({
      now,
      workspaceWorkingHours: settings?.workingHours ?? {},
      members: filteredMembers,
      bookings: filteredBookings,
      blocks,
      count: 2,
      minMinutes: 30,
    });

    return {
      weekly,
      today,
      comparisonRevenue: comparison.bookedRevenue,
      nextAvail,
      now,
      weekLabel,
      showToday,
      todayDate: todayStr,
      weekStartDate: ymd(targetWeekStart),
    };
  }, [filteredMembers, filteredBookings, blocks, services, settings, visibleDate, visibleMode]);

  // Suggestions stay anchored to "now" even when the grid is showing another
  // week. A last-minute gap today should not disappear while the operator
  // skims a future week.
  //
  // Debounce: any optimistic update across the six dependency stores would
  // otherwise re-fire generators within the same animation frame. 800ms
  // collapses bursts (e.g. drag-a-booking, save → multiple store writes)
  // into a single generator run on busy workspaces.
  useEffect(() => {
    if (!workspaceId || !settings) return;
    if (filterMemberId) return;
    const handle = setTimeout(() => {
      pruneOverrides();
      const list = runSuggestions({
        workspaceId,
        now: new Date(),
        bookings,
        blocks,
        clients,
        members,
        services,
        settings,
      });
      setGenerated(list);
    }, 800);
    return () => clearTimeout(handle);
  }, [
    workspaceId,
    settings,
    bookings,
    blocks,
    clients,
    members,
    services,
    pruneOverrides,
    setGenerated,
    filterMemberId,
  ]);

  function handleAct(s: Suggestion) {
    if (s.primaryAction.kind === "send_message") {
      setPreviewSuggestion(s);
      return;
    }
    if (s.primaryAction.kind === "open_calendar" && onNavigateToDate) {
      onNavigateToDate(s.primaryAction.date);
      return;
    }
    if (s.primaryAction.kind === "open_clients") {
      dismiss(s.triggerKey);
    }
  }

  function handleSecondary(s: Suggestion) {
    if (!s.secondaryAction) return;
    if (s.secondaryAction.kind === "open_calendar" && onNavigateToDate) {
      onNavigateToDate(s.secondaryAction.date);
    }
  }

  return (
    <>
      <aside className="w-[300px] flex-shrink-0 space-y-3">
        <OutlookCard
          weekly={weekly}
          today={today}
          weekLabel={weekLabel}
          showToday={showToday}
          nextAvailable={nextAvail}
          now={now}
          workspaceWorkingHours={settings?.workingHours ?? {}}
          todayDate={todayDate}
          weekStartDate={weekStartDate}
        />
        <RevenueCard
          weekly={weekly}
          comparisonRevenue={comparisonRevenue}
          comparisonLabel={showToday ? "vs last week" : "vs previous week"}
        />
        <SuggestionsCard
          suggestions={activeSuggestions}
          onAct={handleAct}
          onSecondary={handleSecondary}
          emptyState={
            filterMemberId
              ? {
                  title: "Suggestions are workspace-wide.",
                  subtitle: "Switch back to Team view to see open offers and rebooks.",
                }
              : undefined
          }
        />
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card-bg border border-border-light rounded-xl hover:border-text-tertiary transition-colors group"
        >
          <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <SettingsIcon className="w-4 h-4 text-text-tertiary group-hover:text-foreground transition-colors" />
            Settings
          </span>
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-foreground transition-colors" />
        </button>
      </aside>
      <SuggestionPreviewModal
        open={previewSuggestion !== null}
        suggestion={previewSuggestion}
        onClose={() => setPreviewSuggestion(null)}
      />
      <CalendarSettingsSlideOver
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
