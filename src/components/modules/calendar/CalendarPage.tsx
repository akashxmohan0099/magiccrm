"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useTeamStore } from "@/store/team";
import { useAuth } from "@/hooks/useAuth";
import { Booking } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { CalendarView } from "@/components/modules/bookings/CalendarView";
import { BookingForm } from "@/components/modules/bookings/BookingForm";
import { BookingDetail } from "@/components/modules/bookings/BookingDetail";

export function CalendarPage() {
  const { bookings } = useBookingsStore();
  const { members } = useTeamStore();
  const { workspaceId } = useAuth();
  const [teamView, setTeamView] = useState<"my" | "team">("team");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);

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
        onTimeSelect={handleTimeSelect}
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
    </div>
  );
}
