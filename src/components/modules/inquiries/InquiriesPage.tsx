"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Plus, MessageCircle, Calendar, CreditCard, FileText, ChevronRight } from "lucide-react";
import { useInquiriesStore } from "@/store/inquiries";
import { useBookingsStore } from "@/store/bookings";
import { useCommunicationStore } from "@/store/communication";
import { useFormsStore } from "@/store/forms";
import { Inquiry, InquiryStatus } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";
import { BookingForm } from "@/components/modules/bookings/BookingForm";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePayment } from "@/hooks/useCreatePayment";
import { GroupedInquiries } from "./GroupedInquiries";
import { LogInquiryForm } from "./LogInquiryForm";

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

export function InquiriesPage() {
  const { inquiries, addInquiry, updateInquiry } = useInquiriesStore();
  const { bookings } = useBookingsStore();
  const { conversations } = useCommunicationStore();
  const { forms } = useFormsStore();
  const { workspaceId } = useAuth();
  const { createPayment } = useCreatePayment();
  const bookingsCountRef = useRef(0);
  const formMap = useMemo(() => new Map(forms.map((f) => [f.id, f])), [forms]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newInquiryOpen, setNewInquiryOpen] = useState(false);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    let result = inquiries;
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q) ||
          (i.serviceInterest || "").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [inquiries, search, statusFilter]);

  const selected = useMemo(
    () => (selectedId ? inquiries.find((i) => i.id === selectedId) : null),
    [selectedId, inquiries]
  );

  const linkedConversation = useMemo(
    () => (selected?.conversationId ? conversations.find((c) => c.id === selected.conversationId) : null),
    [selected, conversations]
  );

  const handleStatusChange = (id: string, status: InquiryStatus) => {
    updateInquiry(id, { status }, workspaceId || undefined);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  const columns: Column<Inquiry>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (i) => <span className="text-[13px] font-medium text-foreground">{i.name}</span>,
    },
    {
      key: "serviceInterest" as keyof Inquiry,
      label: "Interest",
      sortable: true,
      render: (i) => <span className="text-[13px] text-text-secondary">{i.serviceInterest || i.eventType || "—"}</span>,
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (i) => {
        const formName = i.formId ? formMap.get(i.formId)?.name : null;
        return (
          <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
            {i.source === "comms" ? <MessageCircle className="w-3.5 h-3.5" /> : <Inbox className="w-3.5 h-3.5" />}
            {i.source === "comms" ? "Conversation" : formName || "Form"}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (i) => <span className="text-[13px] text-text-secondary">{formatDate(i.createdAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (i) => {
        const colors: Record<InquiryStatus, { dot: string; text: string }> = {
          new: { dot: "bg-blue-500", text: "text-blue-700" },
          in_progress: { dot: "bg-amber-500", text: "text-amber-700" },
          converted: { dot: "bg-emerald-500", text: "text-emerald-700" },
          closed: { dot: "bg-gray-400", text: "text-gray-500" },
        };
        const c = colors[i.status] || colors.new;
        return (
          <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
            <span className={`w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${c.dot}`} />
            <select
              value={i.status}
              onChange={(e) => handleStatusChange(i.id, e.target.value as InquiryStatus)}
              className={`text-[12px] font-semibold ${c.text} bg-transparent border-none outline-none cursor-pointer appearance-none pr-4`}
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Inbound requests from forms and conversations."
        actions={
          <Button variant="primary" size="sm" onClick={() => setNewInquiryOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Inquiry
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search inquiries..." />
        <div className="flex items-center bg-surface rounded-lg p-1 border border-border-light">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
              statusFilter === "all" ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                statusFilter === opt.value ? "bg-card-bg text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <Inbox className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-tertiary text-sm">
            {inquiries.length === 0 ? "No inquiries yet." : "No inquiries match your filters."}
          </p>
        </div>
      ) : (
        <GroupedInquiries
          inquiries={filtered}
          forms={forms}
          formMap={formMap}
          columns={columns}
          onRowClick={(i) => setSelectedId(i.id)}
        />
      )}

      {/* Detail Sidebar */}
      {selected && (
        <SlideOver open onClose={() => setSelectedId(null)} title="">
          <div className="-mt-2 space-y-5">
            {/* Header */}
            <div>
              <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
              <p className="text-[12px] text-text-secondary mt-0.5">
                {selected.source === "comms" ? "From conversation" : "From form"} · {formatDate(selected.createdAt)}
              </p>
              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
              <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Contact</h4>
              {selected.email && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text-tertiary w-12">Email</span>
                  <span className="text-[13px] text-foreground">{selected.email}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text-tertiary w-12">Phone</span>
                  <span className="text-[13px] text-foreground">{selected.phone}</span>
                </div>
              )}
              {selected.clientId && (
                <button
                  onClick={() => {
                    setSelectedId(null);
                    router.push(`/dashboard/clients?client=${selected.clientId}`);
                    toast(`Viewing ${selected.name}`);
                  }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer mt-1"
                >
                  <ChevronRight className="w-3 h-3" /> View Client Profile
                </button>
              )}
            </div>

            {/* Details */}
            <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
              <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Details</h4>
              {selected.serviceInterest && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-tertiary">Interest</span>
                  <span className="text-[13px] text-foreground">{selected.serviceInterest}</span>
                </div>
              )}
              {selected.eventType && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-tertiary">Event</span>
                  <span className="text-[13px] text-foreground">{selected.eventType}</span>
                </div>
              )}
              {selected.dateRange && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-tertiary">Date Range</span>
                  <span className="text-[13px] text-foreground">{selected.dateRange}</span>
                </div>
              )}
            </div>

            {/* Message */}
            {selected.message && (
              <div className="bg-surface rounded-lg p-4 border border-border-light">
                <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Message</h4>
                <p className="text-[13px] text-foreground whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}

            {/* Linked conversation */}
            {linkedConversation && (
              <div className="flex items-center gap-2 text-[12px] text-text-secondary bg-surface rounded-lg px-3 py-2.5 border border-border-light">
                <MessageCircle className="w-3.5 h-3.5" />
                Linked to conversation with {linkedConversation.contactName} via {linkedConversation.channel}
              </div>
            )}

            {/* Status */}
            <div className="bg-surface rounded-lg p-4 border border-border-light">
              <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Status</h4>
              <select
                value={selected.status}
                onChange={(e) => handleStatusChange(selected.id, e.target.value as InquiryStatus)}
                className="w-full text-[13px] bg-card-bg border border-border-light rounded-lg px-3 py-2 text-foreground"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="bg-surface rounded-lg p-4 border border-border-light space-y-2">
              <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Actions</h4>
              {selected.status !== "converted" && selected.status !== "closed" && (
                <button
                  onClick={() => { bookingsCountRef.current = bookings.length; setBookingFormOpen(true); }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group"
                >
                  <Calendar className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                  Create Booking
                </button>
              )}
              <button
                onClick={() => {
                  createPayment({ clientId: selected.clientId || "", clientName: selected.name, label: "quote" });
                }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group"
              >
                <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                Send Quote
              </button>
              <button
                onClick={() => {
                  createPayment({ clientId: selected.clientId || "", clientName: selected.name, label: "invoice" });
                }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group"
              >
                <CreditCard className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                Send Invoice
              </button>
            </div>
          </div>
        </SlideOver>
      )}

      {/* Booking Form from Inquiry */}
      {selected && (
        <BookingForm
          open={bookingFormOpen}
          onClose={() => {
            const wasCreated = useBookingsStore.getState().bookings.length > bookingsCountRef.current;
            setBookingFormOpen(false);
            if (wasCreated && selected && selected.status !== "converted" && selected.status !== "closed") {
              handleStatusChange(selected.id, "converted");
            }
          }}
          defaultDate={new Date().toISOString().split("T")[0]}
          prefill={selected.clientId ? { clientId: selected.clientId } : undefined}
        />
      )}

      {/* New Inquiry Form */}
      <LogInquiryForm
        open={newInquiryOpen}
        onClose={() => setNewInquiryOpen(false)}
        onSave={(data) => {
          addInquiry({
            workspaceId: workspaceId ?? "",
            ...data,
            source: "form",
            status: "new",
          }, workspaceId || undefined);
          setNewInquiryOpen(false);
        }}
      />
    </div>
  );
}
