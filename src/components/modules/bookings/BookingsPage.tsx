"use client";

import { useState, useMemo } from "react";
import { Plus, List, CalendarDays } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { Booking } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { BookingForm } from "./BookingForm";
import { CalendarView } from "./CalendarView";
import { AvailabilitySettings } from "./AvailabilitySettings";
import { BookingPagePreview } from "./BookingPagePreview";

type ViewMode = "list" | "calendar";

export function BookingsPage() {
  const { bookings, deleteBooking } = useBookingsStore();
  const { clients } = useClientsStore();
  const [view, setView] = useState<ViewMode>("calendar");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.clientId && clientMap[b.clientId]?.toLowerCase().includes(q))
    );
  }, [bookings, search, clientMap]);

  const columns: Column<Booking>[] = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (b) => (b.clientId ? clientMap[b.clientId] ?? "—" : "—"),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (b) => new Date(b.date + "T00:00:00").toLocaleDateString(),
    },
    {
      key: "startTime",
      label: "Time",
      sortable: true,
      render: (b) => `${b.startTime} – ${b.endTime}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (b) => <StatusBadge status={b.status} />,
    },
  ];

  const handleRowClick = (booking: Booking) => {
    setEditingBooking(booking);
    setDefaultDate(undefined);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingBooking(undefined);
    setDefaultDate(undefined);
    setFormOpen(true);
  };

  const handleDateSelect = (date: string) => {
    setEditingBooking(undefined);
    setDefaultDate(date);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Bookings & Calendar"
        description="Schedule appointments and manage your calendar."
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Booking
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search bookings..."
        />
        <div className="flex items-center bg-surface rounded-lg p-1 border border-border-light">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "list"
                ? "bg-brand text-white"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "calendar"
                ? "bg-brand text-white"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No bookings yet"
          description="Schedule your first booking to get started."
          actionLabel="New Booking"
          onAction={handleAdd}
        />
      ) : view === "list" ? (
        <div className="bg-card-bg rounded-xl border border-border-warm overflow-hidden">
          <DataTable<Booking>
            columns={columns}
            data={filtered}
            keyExtractor={(b) => b.id}
            onRowClick={handleRowClick}
          />
        </div>
      ) : (
        <CalendarView
          bookings={filtered}
          onDateSelect={handleDateSelect}
          onBookingClick={handleRowClick}
        />
      )}

      <FeatureSection moduleId="bookings-calendar" featureId="availability">
        <AvailabilitySettings />
      </FeatureSection>

      <FeatureSection moduleId="bookings-calendar" featureId="booking-page">
        <BookingPagePreview />
      </FeatureSection>

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
