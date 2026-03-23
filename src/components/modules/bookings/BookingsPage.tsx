"use client";

import { useState, useMemo } from "react";
import { Plus, List, CalendarDays, Calendar } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { Booking } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
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
import { RebookingPrompts } from "./RebookingPrompts";
import { WaitlistPanel } from "./WaitlistPanel";
import { TextArea } from "@/components/ui/TextArea";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { useTeamStore } from "@/store/team";
import { useModuleEnabled } from "@/hooks/useFeature";

type ViewMode = "list" | "calendar";

export function BookingsPage() {
  const { bookings, deleteBooking: _deleteBooking, cancellationPolicy, setCancellationPolicy } = useBookingsStore();
  const { clients } = useClientsStore();
  const { members } = useTeamStore();
  const teamEnabled = useModuleEnabled("team");
  const vocab = useVocabulary();
  const [view, setView] = useState<ViewMode>("calendar");
  const [search, setSearch] = useState("");
  const [teamView, setTeamView] = useState<"my" | "team">("team");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [_defaultStartTime, setDefaultStartTime] = useState<string | undefined>(undefined);
  const [_defaultEndTime, setDefaultEndTime] = useState<string | undefined>(undefined);
  const [waitlistDate, setWaitlistDate] = useState(() => new Date().toISOString().split("T")[0]);

  // For "My" view: use the first owner/member as "current user" (placeholder until auth)
  const currentUserId = useMemo(() => {
    const owner = members.find((m) => m.role === "owner");
    return owner?.id ?? members[0]?.id;
  }, [members]);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    let result = bookings;

    // Apply "My" view filter
    if (teamView === "my" && currentUserId) {
      result = result.filter((b) => b.assignedToId === currentUserId);
    }

    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.clientId && clientMap[b.clientId]?.toLowerCase().includes(q))
    );
  }, [bookings, search, clientMap, teamView, currentUserId]);

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
      key: "assignedToName" as keyof Booking,
      label: "Assigned To",
      sortable: true,
      render: (b) => (
        <span className="text-text-secondary text-xs">
          {b.assignedToName ?? "\u2014"}
        </span>
      ),
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
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
    setWaitlistDate(date);
    setFormOpen(true);
  };

  const handleTimeSelect = (date: string, startTime: string, endTime: string) => {
    setEditingBooking(undefined);
    setDefaultDate(date);
    setDefaultStartTime(startTime);
    setDefaultEndTime(endTime);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Scheduling"
        description={`Schedule ${vocab.bookings.toLowerCase()} and manage your calendar.`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            {vocab.addBooking}
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${vocab.bookings.toLowerCase()}...`}
        />
        {teamEnabled && members.length > 0 && (
          <ViewToggle
            view={teamView}
            onChange={setTeamView}
            moduleLabel={vocab.bookings}
          />
        )}
        <div className="flex items-center bg-surface rounded-lg p-1 border border-border-light">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "list"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "calendar"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contextual setup — removed, uses EmptyState setupSteps pattern below */}

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10" />}
          title={`No ${vocab.bookings.toLowerCase()} yet`}
          description={`Set up your scheduling first, then start taking ${vocab.bookings.toLowerCase()}.`}
          setupSteps={[
            { label: `Create your first ${vocab.booking.toLowerCase()}`, description: "Or wait for clients to book you", action: handleAdd },
          ]}
        />
      ) : view === "list" ? (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
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
          onTimeSelect={handleTimeSelect}
        />
      )}

      {bookings.length > 0 && (
        <>
          <AvailabilitySettings />

          <WaitlistPanel selectedDate={waitlistDate} />

          <FeatureSection moduleId="bookings-calendar" featureId="cancellation-policy" featureLabel="Cancellation Policy">
            <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
              <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Cancellation Policy</h3>
              <p className="text-[11px] text-text-tertiary mb-2">Set your cancellation policy text. Clients will be asked to consent when booking.</p>
              <TextArea
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Enter your cancellation policy here, e.g. Cancellations must be made at least 24 hours in advance..."
                rows={4}
              />
            </div>
          </FeatureSection>

          <FeatureSection moduleId="bookings-calendar" featureId="team-calendar" featureLabel="Team Calendar">
            <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
              <p className="text-[13px] font-medium text-foreground">Team Calendar View</p>
              <p className="text-[11px] text-text-tertiary">See all team members&apos; schedules side by side. Filter by team member from the calendar header.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="bookings-calendar" featureId="booking-page">
            <BookingPagePreview />
          </FeatureSection>

          <RebookingPrompts />
        </>
      )}

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
