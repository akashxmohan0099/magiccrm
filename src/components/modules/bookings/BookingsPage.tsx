"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Calendar } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { Booking, BookingStatus } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { BookingForm } from "./BookingForm";
import { BookingDetail } from "./BookingDetail";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { useTeamStore } from "@/store/team";
import { useAuth } from "@/hooks/useAuth";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export function BookingsPage() {
  const { bookings, updateBooking } = useBookingsStore();
  const { clients } = useClientsStore();
  const { services } = useServicesStore();
  const { members } = useTeamStore();
  const { workspaceId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [teamView, setTeamView] = useState<"my" | "team">("team");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);

  const clearQueryParams = useCallback((keys: string[]) => {
    const next = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => next.delete(key));
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add" && !formOpen) {
      const timeout = window.setTimeout(() => {
        setEditingBooking(undefined);
        setFormOpen(true);
      }, 0);
      clearQueryParams(["action"]);
      return () => window.clearTimeout(timeout);
    }

    const bookingId = searchParams.get("booking");
    if (
      bookingId &&
      bookingId !== detailBookingId &&
      bookings.some((booking) => booking.id === bookingId)
    ) {
      const timeout = window.setTimeout(() => {
        setDetailBookingId(bookingId);
      }, 0);
      clearQueryParams(["booking"]);
      return () => window.clearTimeout(timeout);
    }
  }, [bookings, clearQueryParams, detailBookingId, formOpen, searchParams]);

  const currentUserId = useMemo(() => {
    const owner = members.find((m) => m.role === "owner");
    return owner?.id ?? members[0]?.id;
  }, [members]);

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

  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => { map[m.id] = m.name; });
    return map;
  }, [members]);

  const formatTime = (isoOrTime: string) => {
    if (isoOrTime.includes("T")) {
      return new Date(isoOrTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    }
    return isoOrTime;
  };

  const handleStatusChange = useCallback((bookingId: string, newStatus: BookingStatus) => {
    updateBooking(bookingId, { status: newStatus }, workspaceId || undefined);
  }, [updateBooking, workspaceId]);

  const handleAssigneeChange = useCallback((bookingId: string, memberId: string) => {
    updateBooking(bookingId, { assignedToId: memberId || undefined }, workspaceId || undefined);
  }, [updateBooking, workspaceId]);

  const handleServiceChange = useCallback((bookingId: string, serviceId: string) => {
    updateBooking(bookingId, { serviceId: serviceId || undefined }, workspaceId || undefined);
  }, [updateBooking, workspaceId]);

  const handleDateChange = useCallback((bookingId: string, newDate: string) => {
    if (!newDate) return;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    // Shift start/end times to the new date
    const oldStart = new Date(booking.startAt);
    const oldEnd = new Date(booking.endAt);
    const [year, month, day] = newDate.split("-").map(Number);
    const newStart = new Date(oldStart);
    newStart.setFullYear(year, month - 1, day);
    const newEnd = new Date(oldEnd);
    newEnd.setFullYear(year, month - 1, day);
    updateBooking(bookingId, { date: newDate, startAt: newStart.toISOString(), endAt: newEnd.toISOString() }, workspaceId || undefined);
  }, [updateBooking, workspaceId, bookings]);

  const filtered = useMemo(() => {
    let result = bookings;
    if (teamView === "my" && currentUserId) {
      result = result.filter((b) => b.assignedToId === currentUserId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => {
        const serviceName = b.serviceId ? serviceMap[b.serviceId] : "";
        const clientName = b.clientId ? clientMap[b.clientId] : "";
        return serviceName.toLowerCase().includes(q) || clientName.toLowerCase().includes(q) || b.notes?.toLowerCase().includes(q);
      });
    }
    return [...result].sort((a, b) => b.date.localeCompare(a.date) || b.startAt.localeCompare(a.startAt));
  }, [bookings, search, clientMap, serviceMap, teamView, currentUserId]);

  const columns: Column<Booking>[] = [
    {
      key: "serviceId" as keyof Booking,
      label: "Service",
      sortable: false,
      render: (b) => (
        <InlineSelect
          value={b.serviceId || ""}
          options={services.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => handleServiceChange(b.id, v)}
          placeholder="Select service"
        />
      ),
    },
    {
      key: "clientId",
      label: "Client",
      sortable: false,
      render: (b) => (
        <span className="text-[13px] text-foreground">
          {b.clientId ? clientMap[b.clientId] ?? "—" : "—"}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: false,
      render: (b) => (
        <input
          type="date"
          value={b.date}
          onChange={(e) => handleDateChange(b.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-[13px] text-foreground bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors"
        />
      ),
    },
    {
      key: "startAt",
      label: "Time",
      sortable: false,
      render: (b) => (
        <span className="text-[13px] text-text-secondary">
          {formatTime(b.startAt)} – {formatTime(b.endAt)}
        </span>
      ),
    },
    {
      key: "assignedToId" as keyof Booking,
      label: "Assigned To",
      sortable: false,
      render: (b) => (
        <InlineSelect
          value={b.assignedToId || ""}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
          onChange={(v) => handleAssigneeChange(b.id, v)}
          placeholder="Unassigned"
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (b) => (
        <InlineStatusSelect
          value={b.status}
          options={STATUS_OPTIONS}
          onChange={(v) => handleStatusChange(b.id, v)}
        />
      ),
    },
  ];

  const handleRowClick = (booking: Booking) => {
    setDetailBookingId(booking.id);
  };

  const handleAdd = () => {
    setEditingBooking(undefined);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="All confirmed and upcoming appointments."
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Booking
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search bookings..." />
        {members.length > 1 && (
          <ViewToggle view={teamView} onChange={setTeamView} moduleLabel="Bookings" />
        )}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10" />}
          title="No bookings yet"
          description="Create your first booking or wait for clients to book online."
          setupSteps={[{ label: "Create your first booking", description: "Or wait for clients to book you", action: handleAdd }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<Booking>
            storageKey="magic-crm-bookings-columns"
            columns={columns}
            data={filtered}
            keyExtractor={(b) => b.id}
            onRowClick={handleRowClick}
          />
        </div>
      )}

      <BookingDetail
        open={detailBookingId !== null}
        onClose={() => setDetailBookingId(null)}
        bookingId={detailBookingId}
        onEdit={(booking) => {
          setDetailBookingId(null);
          setEditingBooking(booking);
          setFormOpen(true);
        }}
      />

      <BookingForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingBooking(undefined); }}
        booking={editingBooking}
      />
    </div>
  );
}

// ── Inline editable components ────────────────────────────────

function InlineSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const label = options.find((o) => o.value === value)?.label || placeholder || "—";

  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className="text-[13px] text-foreground bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4 max-w-[160px] truncate"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function InlineStatusSelect({
  value,
  options,
  onChange,
}: {
  value: BookingStatus;
  options: { value: BookingStatus; label: string }[];
  onChange: (value: BookingStatus) => void;
}) {
  const STATUS_DOT_COLORS: Record<BookingStatus, string> = {
    confirmed: "bg-emerald-500",
    pending: "bg-amber-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
    no_show: "bg-red-500",
  };

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <span className={`w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${STATUS_DOT_COLORS[value] || "bg-gray-400"}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BookingStatus)}
        className="text-[12px] font-semibold text-foreground bg-transparent border-none outline-none cursor-pointer appearance-none pr-4"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
