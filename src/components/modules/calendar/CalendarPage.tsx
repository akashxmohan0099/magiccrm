"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useTeamStore } from "@/store/team";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { useAuth } from "@/hooks/useAuth";
import { Booking, BlockKind, CalendarBlock } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { CalendarView } from "@/components/modules/bookings/CalendarView";
import { BookingForm } from "@/components/modules/bookings/BookingForm";
import { BookingDetail } from "@/components/modules/bookings/BookingDetail";
import { BlockForm } from "@/components/modules/bookings/BlockForm";

export function CalendarPage() {
  const { bookings, updateBooking } = useBookingsStore();
  const { members } = useTeamStore();
  const { addBlock } = useCalendarBlocksStore();
  const { workspaceId } = useAuth();
  const [teamView, setTeamView] = useState<"my" | "team">("team");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [blockDefaults, setBlockDefaults] = useState<{
    kind: BlockKind;
    date?: string;
    start?: string;
    end?: string;
  }>({ kind: "blocked" });
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | undefined>(undefined);

  const currentUserId = useMemo(() => {
    const owner = members.find((m) => m.role === "owner");
    return owner?.id ?? members[0]?.id;
  }, [members]);

  const filtered = useMemo(() => {
    if (teamView === "my" && currentUserId) {
      return bookings.filter((b) => b.assignedToId === currentUserId);
    }
    return bookings;
  }, [bookings, teamView, currentUserId]);

  const handleDateSelect = (date: string) => {
    setEditingBooking(undefined);
    setDefaultDate(date);
    setFormOpen(true);
  };

  const handleTimeSelect = (date: string) => {
    setEditingBooking(undefined);
    setDefaultDate(date);
    setFormOpen(true);
  };

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
    const startISO = new Date(`${date}T${startTime}:00`).toISOString();
    const endISO = new Date(`${date}T${endTime}:00`).toISOString();
    addBlock(
      {
        workspaceId: workspaceId || "",
        teamMemberId: undefined,
        kind,
        date,
        startTime: startISO,
        endTime: endISO,
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
            <Button variant="primary" size="sm" onClick={() => { setEditingBooking(undefined); setDefaultDate(undefined); setFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Booking
            </Button>
          </div>
        }
      />

      <CalendarView
        bookings={filtered}
        onDateSelect={handleDateSelect}
        onBookingClick={handleBookingClick}
        onBookingMove={(booking, newStartAt, newEndAt) => {
          // Drag-to-move on the day view. Recompute the date string from the
          // ISO so a drop near midnight could in theory cross days (though
          // current handler keeps it within the same day).
          const newDate = newStartAt.slice(0, 10);
          updateBooking(
            booking.id,
            { startAt: newStartAt, endAt: newEndAt, date: newDate },
            workspaceId || undefined,
          );
        }}
        onTimeSelect={handleTimeSelect}
        onBlockCreate={handleBlockCreate}
        onBlockClick={handleBlockClick}
        selectionVisible={formOpen || blockFormOpen}
      />

      <BookingDetail
        open={detailBookingId !== null}
        onClose={() => setDetailBookingId(null)}
        bookingId={detailBookingId}
        onEdit={(booking) => {
          setDetailBookingId(null);
          setEditingBooking(booking);
          setDefaultDate(undefined);
          setFormOpen(true);
        }}
      />

      <BookingForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingBooking(undefined);
          setDefaultDate(undefined);
        }}
        booking={editingBooking}
        defaultDate={defaultDate}
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
    </div>
  );
}
