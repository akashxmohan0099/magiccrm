"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, Plus, MessageCircle, Calendar, CreditCard, FileText, ChevronRight } from "lucide-react";
import { useInquiriesStore } from "@/store/inquiries";
import { useBookingsStore } from "@/store/bookings";
import { useCommunicationStore } from "@/store/communication";
import { useFormsStore } from "@/store/forms";
import { useFormResponsesStore } from "@/store/form-responses";
import { Inquiry, InquiryStatus } from "@/types/models";
import { withoutTestInquiries } from "@/lib/forms/test-submission";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";
import { BookingForm } from "@/components/modules/bookings/BookingForm";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePayment } from "@/hooks/useCreatePayment";
import { LogInquiryForm } from "./LogInquiryForm";
import { inquiryFieldValue, humaniseKey, STATUS_OPTIONS } from "./helpers";
import { NotesEditor } from "./NotesEditor";
import { InlineInterestCell, InterestRow } from "./InterestEditors";
import { InlineStatusCell } from "./InlineStatusCell";

export function InquiriesPage() {
  const { inquiries, addInquiry, updateInquiry } = useInquiriesStore();
  const { bookings } = useBookingsStore();
  const { conversations } = useCommunicationStore();
  const { forms } = useFormsStore();
  const { formResponses } = useFormResponsesStore();
  const { workspaceId } = useAuth();
  const { createPayment } = useCreatePayment();
  const bookingsCountRef = useRef(0);
  const formMap = useMemo(() => new Map(forms.map((f) => [f.id, f])), [forms]);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newInquiryOpen, setNewInquiryOpen] = useState(false);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    // Test submissions (created via Forms → Send test) carry a "[TEST] "
    // prefix on the name and `__test:"true"` in submission_values. They
    // round-trip through the same pipeline as real submissions but should
    // never appear in the operator's inbox.
    let result = withoutTestInquiries(inquiries);
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

  useEffect(() => {
    const leadId = searchParams.get("lead") || searchParams.get("inquiry");
    if (!leadId) return;
    if (inquiries.some((i) => i.id === leadId)) {
      const t = window.setTimeout(() => setSelectedId(leadId), 0);
      return () => window.clearTimeout(t);
    }
  }, [searchParams, inquiries]);

  const linkedConversation = useMemo(
    () => (selected?.conversationId ? conversations.find((c) => c.id === selected.conversationId) : null),
    [selected, conversations]
  );

  const handleStatusChange = (id: string, status: InquiryStatus) => {
    updateInquiry(id, { status }, workspaceId || undefined);
  };

  // Long-form date for the detail panel.
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  // "Now" anchor for relative-time formatting. Updates once a minute so
  // labels like "5m ago" tick over without re-rendering on every parent
  // change. Captured here (not via Date.now() in render) so the format
  // function below stays a pure function of its inputs.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Relative time for the table — fresh inquiries should feel fresh.
  // Falls back to the date format above for anything older than ~a week.
  const formatRelative = (iso: string) => {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "—";
    const diffSec = Math.max(0, (now - then) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(iso);
  };

  const STATUS_PILL: Record<InquiryStatus, { dot: string; bg: string; text: string; label: string }> = {
    new:         { dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",    label: "New" },
    in_progress: { dot: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",   label: "In progress" },
    converted:   { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Converted" },
    closed:      { dot: "bg-gray-400",    bg: "bg-gray-100",   text: "text-gray-600",    label: "Closed" },
  };

  const columns: Column<Inquiry>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      removable: false,
      render: (i) => (
        <span className="text-[13px] font-medium text-foreground">{i.name}</span>
      ),
    },
    {
      key: "interest",
      label: "Interest",
      sortable: true,
      render: (i) => <InlineInterestCell inquiry={i} />,
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (i) => {
        const formName = i.formId ? formMap.get(i.formId)?.name : null;
        const isForm = i.source === "form" && !!i.formId;
        const isManual = i.source === "form" && !i.formId;
        return (
          <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
            {i.source === "comms" ? (
              <MessageCircle className="w-3.5 h-3.5" />
            ) : (
              <Inbox className="w-3.5 h-3.5" />
            )}
            {i.source === "comms"
              ? "Conversation"
              : isManual
                ? "Manual"
                : isForm
                  ? `Form: ${formName ?? "Unknown"}`
                  : "Form"}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Received",
      sortable: true,
      render: (i) => (
        <span className="text-[13px] text-text-secondary tabular-nums">
          {formatRelative(i.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (i) => <InlineStatusCell inquiry={i} pillStyles={STATUS_PILL} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Your sales pipeline — leads from forms, conversations, and manual logs."
        actions={
          <Button variant="primary" size="sm" onClick={() => setNewInquiryOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Lead
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6" role="search" aria-label="Filter leads">
        <SearchInput value={search} onChange={setSearch} placeholder="Search leads..." />
        <div
          className="flex items-center bg-surface rounded-lg p-1 border border-border-light"
          role="radiogroup"
          aria-label="Status filter"
        >
          <button
            onClick={() => setStatusFilter("all")}
            role="radio"
            aria-checked={statusFilter === "all"}
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
              role="radio"
              aria-checked={statusFilter === opt.value}
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
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6 text-primary" />
          </div>
          {inquiries.length === 0 ? (
            <>
              <h3 className="text-[15px] font-bold text-foreground mb-1">No leads yet</h3>
              <p className="text-[13px] text-text-secondary mb-5">
                {forms.length === 0
                  ? "Create a form to start collecting leads from your website or social bio."
                  : "Share your form's public URL — submissions will appear here in real time."}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  forms.length === 0
                    ? router.push("/dashboard/forms")
                    : setNewInquiryOpen(true)
                }
              >
                {forms.length === 0 ? "Create a form" : "Log a lead manually"}
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-[15px] font-bold text-foreground mb-1">Nothing matches</h3>
              <p className="text-[13px] text-text-secondary mb-5">
                No leads match your current filters.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div
          className="bg-card-bg border border-border-light rounded-xl overflow-hidden"
          role="region"
          aria-label={`Leads — ${filtered.length} ${filtered.length === 1 ? "result" : "results"}`}
        >
          <DataTable<Inquiry>
            storageKey="magic-crm-inquiries"
            columns={columns}
            data={filtered}
            keyExtractor={(i) => i.id}
            onRowClick={(i) => setSelectedId(i.id)}
          />
        </div>
      )}

      {/* Detail Sidebar */}
      {selected && (
        <SlideOver open onClose={() => setSelectedId(null)} title="">
          <div className="-mt-2 space-y-5">
            {/* Header */}
            <div>
              <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
              <p className="text-[12px] text-text-secondary mt-0.5">
                {selected.source === "comms" ? "From conversation" : "From form"} ·{" "}
                <span title={formatDate(selected.createdAt)}>
                  {formatRelative(selected.createdAt)}
                </span>
              </p>
              <div className="mt-2">
                {(() => {
                  const c = STATUS_PILL[selected.status] ?? STATUS_PILL.new;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-[11px] font-semibold`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {c.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
              <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Contact</h4>
              {selected.email && (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] text-text-tertiary w-12 shrink-0">Email</span>
                  <span className="text-[13px] text-foreground min-w-0 break-all">{selected.email}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] text-text-tertiary w-12 shrink-0">Phone</span>
                  <span className="text-[13px] text-foreground min-w-0 break-all">{selected.phone}</span>
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

            {/* Submission — when the inquiry came from a known form, walk
                its field config in order so the panel mirrors what the
                client actually filled in (with the form's own labels).
                Falls back to the structured columns for legacy inquiries. */}
            {(() => {
              const sourceForm = selected.formId ? formMap.get(selected.formId) : null;
              const linkedResponse = selected.formResponseId
                ? formResponses.find((r) => r.id === selected.formResponseId)
                : null;
              // Prefer the linked form_response's values; fall back to legacy
              // inquiry.submissionValues so older rows still render.
              const enriched: Inquiry = linkedResponse
                ? { ...selected, submissionValues: linkedResponse.values }
                : selected;

              const skipKeys = new Set([
                "name", "full_name", "fullName", "client_name",
                "email",
                "phone", "mobile", "contact_phone",
                "message", "your_message", "details",
              ]);

              if (sourceForm) {
                const fieldRows = sourceForm.fields
                  .filter((f) => !skipKeys.has(f.name))
                  .map((f) => ({
                    label: f.label,
                    value: inquiryFieldValue(enriched, f.name),
                    isLong: f.type === "textarea",
                  }))
                  .filter((r) => r.value);

                // Catch values from submissions made before the form was
                // edited — fields removed from the form would otherwise be
                // dropped silently. Render them with humanised keys.
                const knownNames = new Set([
                  ...sourceForm.fields.map((f) => f.name),
                  ...skipKeys,
                ]);
                const strayRows = Object.entries(enriched.submissionValues ?? {})
                  .filter(([key, value]) => value && !knownNames.has(key))
                  .map(([key, value]) => ({
                    label: humaniseKey(key),
                    value,
                    isLong: value.length > 80 || value.includes("\n"),
                  }));

                const rows = [...fieldRows, ...strayRows];

                if (rows.length === 0 && !selected.serviceInterest) return null;

                return (
                  <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
                    <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
                      Submission
                    </h4>
                    <InterestRow inquiry={selected} />
                    {rows.map((r, i) =>
                      r.isLong ? (
                        <div key={i} className="space-y-1">
                          <span className="text-[11px] text-text-tertiary block">{r.label}</span>
                          <p className="text-[13px] text-foreground whitespace-pre-wrap bg-card-bg rounded-md px-3 py-2 border border-border-light">
                            {r.value}
                          </p>
                        </div>
                      ) : (
                        <div key={i} className="flex items-start justify-between gap-3">
                          <span className="text-[12px] text-text-tertiary flex-shrink-0">{r.label}</span>
                          <span className="text-[13px] text-foreground text-right break-words">{r.value}</span>
                        </div>
                      ),
                    )}
                  </div>
                );
              }

              // Legacy / non-form fallback: keep the structured fields.
              const hasAny = selected.serviceInterest || selected.eventType || selected.dateRange;
              if (!hasAny) return null;
              return (
                <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Details</h4>
                  <InterestRow inquiry={selected} />
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
              );
            })()}

            {/* Message — separated from Submission so long-form replies
                always have their own block, regardless of how the form was
                shaped. */}
            {selected.message && (
              <div className="bg-surface rounded-lg p-4 border border-border-light">
                <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Message</h4>
                <p className="text-[13px] text-foreground whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}

            {/* Internal notes — private to the team, never shown to the client. */}
            <NotesEditor
              key={selected.id}
              initial={selected.notes ?? ""}
              onSave={(val) =>
                updateInquiry(selected.id, { notes: val }, workspaceId || undefined)
              }
            />

            {/* Linked conversation */}
            {linkedConversation && (
              <div className="flex items-center gap-2 text-[12px] text-text-secondary bg-surface rounded-lg px-3 py-2.5 border border-border-light">
                <MessageCircle className="w-3.5 h-3.5" />
                Linked to conversation with {linkedConversation.contactName} via {linkedConversation.channel}
              </div>
            )}

            {/* Status quick-actions — context-aware. Only the next-step
                buttons show up so the panel doesn't crowd the user with
                every possible state transition. */}
            <div className="bg-surface rounded-lg p-4 border border-border-light">
              <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Update status
              </h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = selected.status === opt.value;
                  const c = STATUS_PILL[opt.value];
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(selected.id, opt.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold cursor-pointer transition-colors ${
                        isActive
                          ? `${c.bg} ${c.text} border-transparent`
                          : "bg-card-bg text-text-secondary border-border-light hover:border-foreground/20 hover:text-foreground"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
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




