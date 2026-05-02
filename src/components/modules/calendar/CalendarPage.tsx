"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useTeamStore } from "@/store/team";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import { checkConflicts } from "@/lib/calendar/conflicts";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Booking, BlockKind, CalendarBlock } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { toast } from "@/components/ui/Toast";
import {
  CalendarView,
  type CalendarMode,
  type CalendarViewHandle,
} from "@/components/modules/bookings/CalendarView";
import { BookingForm } from "@/components/modules/bookings/BookingForm";
import { BookingDetail } from "@/components/modules/bookings/BookingDetail";
import { BlockForm } from "@/components/modules/bookings/BlockForm";
import { CalendarRail } from "./CalendarRail";
import { DayActionPopover } from "./DayActionPopover";

export function CalendarPage() {
  const { bookings, updateBooking } = useBookingsStore();
  const { members } = useTeamStore();
  const { addBlock, deleteBlock, blocks } = useCalendarBlocksStore();
  const settings = useSettingsStore((s) => s.settings);
  const { workspaceId, member } = useAuth();
  const [teamView, setTeamView] = useState<"my" | "team">("team");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [bookingPrefill, setBookingPrefill] = useState<
    { startAt?: string; endAt?: string; serviceId?: string; clientId?: string } | undefined
  >(undefined);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("today");
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [blockDefaults, setBlockDefaults] = useState<{
    kind: BlockKind;
    date?: string;
    start?: string;
    end?: string;
  }>({ kind: "blocked" });
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | undefined>(undefined);

  // Day-action popover state
  const [dayPopover, setDayPopover] = useState<{ date: string; anchorRect: DOMRect } | null>(null);
  const calendarRef = useRef<CalendarViewHandle | null>(null);

  // Resolve "me" from auth — `useAuth().member.id` is the workspace_members
  // row for the signed-in user. Fallback to owner for unauthenticated /dev
  // sessions so the toggle still works in local play.
  const currentUserId = useMemo(() => {
    if (member?.id) return member.id;
    const owner = members.find((m) => m.role === "owner");
    return owner?.id ?? members[0]?.id;
  }, [member?.id, members]);

  const isOwner = member?.role === "owner";

  const filtered = useMemo(() => {
    if (teamView !== "my" || !currentUserId) return bookings;
    // Owners see their own bookings AND any unassigned ones — those are
    // bookings still waiting to be triaged, and hiding them silently was
    // the cause of "where did my new booking go?" reports.
    return bookings.filter((b) => {
      if (b.assignedToId === currentUserId) return true;
      if (isOwner && !b.assignedToId) return true;
      return false;
    });
  }, [bookings, teamView, currentUserId, isOwner]);

  const handleDateSelect = (date: string) => {
    setEditingBooking(undefined);
    setDefaultDate(date);
    setBookingPrefill(undefined);
    setFormOpen(true);
  };

  const handleTimeSelect = (date: string, startTime: string, endTime: string) => {
    setEditingBooking(undefined);
    setDefaultDate(date);
    setBookingPrefill({ startAt: startTime, endAt: endTime });
    setFormOpen(true);
  };

  const handleCalendarViewChange = useCallback(
    (next: { mode?: CalendarMode; currentDate?: Date }) => {
      if (next.mode) setCalendarMode(next.mode);
      if (next.currentDate) setCalendarDate(next.currentDate);
    },
    [],
  );

  const handleBookingClick = (booking: Booking) => {
    setDetailBookingId(booking.id);
  };

  const handleBlockCreate = (
    date: string,
    startTime: string,
    endTime: string,
    kind: BlockKind,
    openForm: boolean
  ) => {
    if (openForm) {
      setEditingBlock(undefined);
      setBlockDefaults({ kind, date, start: startTime, end: endTime });
      setBlockFormOpen(true);
      return;
    }
    // Quick blocks (break, cleanup, lunch, travel, prep) — create immediately.
    // Persist times as wall-clock ISO strings (no Z, no Date roundtrip) so
    // the utilization engine and other readers interpret them in workspace
    // local time. Constructing via `new Date(...).toISOString()` would
    // shift the time into UTC and corrupt the day key in non-UTC zones.
    addBlock(
      {
        workspaceId: workspaceId || "",
        teamMemberId: undefined,
        kind,
        date,
        startTime: `${date}T${startTime}:00`,
        endTime: `${date}T${endTime}:00`,
        isPrivate: true,
        isRecurring: false,
      },
      workspaceId ?? undefined
    );
  };

  const handleBlockClick = (block: CalendarBlock) => {
    setEditingBlock(block);
    setBlockFormOpen(true);
  };

  // ── Day-action popover handlers ──
  const openDayPopover = (date: string, anchorRect: DOMRect) => {
    setDayPopover({ date, anchorRect });
  };
  const closeDayPopover = () => setDayPopover(null);

  const handleOpenDay = () => {
    if (!dayPopover) return;
    calendarRef.current?.goto(dayPopover.date, "today");
    closeDayPopover();
  };
  const handleAddBookingForDay = () => {
    if (!dayPopover) return;
    setEditingBooking(undefined);
    setDefaultDate(dayPopover.date);
    setBookingPrefill(undefined);
    setFormOpen(true);
    closeDayPopover();
  };
  // Close-day is destructive (writes a full-day block visible to clients
  // and zeroes the day's bookable minutes) so we confirm first, then offer
  // Undo via the toast in case it was a mis-click.
  const [closeDayConfirm, setCloseDayConfirm] = useState<string | null>(null);
  const handleCloseDay = () => {
    if (!dayPopover) return;
    setCloseDayConfirm(dayPopover.date);
    closeDayPopover();
  };
  const performCloseDay = (date: string) => {
    const block = addBlock(
      {
        workspaceId: workspaceId || "",
        teamMemberId: undefined,
        kind: "vacation",
        date,
        startTime: `${date}T00:00:00`,
        endTime: `${date}T23:59:00`,
        isPrivate: false,
        isRecurring: false,
        label: "Closed",
      },
      workspaceId ?? undefined,
    );
    toast(`Closed ${formatDayShort(date)}`, {
      type: "success",
      action: {
        label: "Undo",
        onClick: () => deleteBlock(block.id, workspaceId ?? undefined),
      },
    });
    setCloseDayConfirm(null);
  };
  const handleEditHoursForDay = () => {
    if (!dayPopover) return;
    setEditingBlock(undefined);
    setBlockDefaults({
      kind: "unavailable",
      date: dayPopover.date,
      start: "17:00",
      end: "19:00",
    });
    setBlockFormOpen(true);
    closeDayPopover();
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Visual schedule of all bookings."
        actions={
          <div className="flex items-center gap-3">
            {members.length > 1 && (
              <ViewToggle
                view={teamView}
                onChange={setTeamView}
                moduleLabel="Calendar"
              />
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingBooking(undefined);
                setDefaultDate(undefined);
                setBookingPrefill(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Booking
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <CalendarView
            ref={calendarRef}
            bookings={filtered}
            mode={calendarMode}
            currentDate={calendarDate}
            onViewChange={handleCalendarViewChange}
            onDateSelect={handleDateSelect}
            onBookingClick={handleBookingClick}
            onBookingMove={(booking, newStartAt, newEndAt) => {
              // Drag-to-move on the day view. CalendarView returns wall-clock
              // ISO-like strings so the visible local time does not shift.
              const newDate = newStartAt.slice(0, 10);
              const conflicts = checkConflicts({
                date: newDate,
                startAt: newStartAt,
                endAt: newEndAt,
                memberId: booking.assignedToId,
                excludeBookingId: booking.id,
                bookings,
                blocks,
                members,
                workspaceWorkingHours: settings?.workingHours ?? {},
              });
              if (conflicts.length > 0) {
                toast(`Move blocked: ${conflicts[0].message}`, "warning");
                return;
              }
              const prev = {
                startAt: booking.startAt,
                endAt: booking.endAt,
                date: booking.date,
              };
              updateBooking(
                booking.id,
                { startAt: newStartAt, endAt: newEndAt, date: newDate },
                workspaceId || undefined,
              );
              toast("Booking moved", {
                type: "success",
                action: {
                  label: "Undo",
                  onClick: () =>
                    updateBooking(booking.id, prev, workspaceId || undefined),
                },
              });
            }}
            onTimeSelect={handleTimeSelect}
            onBlockCreate={handleBlockCreate}
            onBlockClick={handleBlockClick}
            onDayQuickAction={openDayPopover}
            selectionVisible={formOpen || blockFormOpen}
          />
        </div>
        <CalendarRail
          filterMemberId={teamView === "my" ? currentUserId : undefined}
          includeUnassigned={teamView === "my" && isOwner}
          visibleDate={calendarDate}
          visibleMode={calendarMode}
          onNavigateToDate={(date) => calendarRef.current?.goto(date, "today")}
        />
      </div>

      <BookingDetail
        open={detailBookingId !== null}
        onClose={() => setDetailBookingId(null)}
        bookingId={detailBookingId}
        onEdit={(booking) => {
          setDetailBookingId(null);
          setEditingBooking(booking);
          setDefaultDate(undefined);
          setBookingPrefill(undefined);
          setFormOpen(true);
        }}
      />

      <BookingForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingBooking(undefined);
          setDefaultDate(undefined);
          setBookingPrefill(undefined);
        }}
        booking={editingBooking}
        defaultDate={defaultDate}
        prefill={bookingPrefill}
      />

      <BlockForm
        open={blockFormOpen}
        onClose={() => {
          setBlockFormOpen(false);
          setEditingBlock(undefined);
        }}
        block={editingBlock}
        defaultKind={blockDefaults.kind}
        defaultDate={blockDefaults.date}
        defaultStart={blockDefaults.start}
        defaultEnd={blockDefaults.end}
      />

      <DayActionPopover
        open={dayPopover !== null}
        date={dayPopover?.date ?? null}
        anchorRect={dayPopover?.anchorRect ?? null}
        onClose={closeDayPopover}
        onOpenDay={handleOpenDay}
        onAddBooking={handleAddBookingForDay}
        onCloseDay={handleCloseDay}
        onEditHours={handleEditHoursForDay}
      />

      <ConfirmDialog
        open={closeDayConfirm !== null}
        onClose={() => setCloseDayConfirm(null)}
        onConfirm={() => {
          if (closeDayConfirm) performCloseDay(closeDayConfirm);
        }}
        title="Close this day?"
        message={
          closeDayConfirm
            ? `Mark ${formatDayShort(closeDayConfirm)} as closed. Existing bookings stay, but no new ones can be made and clients see "Unavailable" on the booking page.`
            : ""
        }
        confirmLabel="Close day"
        variant="danger"
      />
    </div>
  );
}

function formatDayShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
