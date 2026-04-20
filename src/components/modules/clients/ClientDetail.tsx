"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Phone, Calendar, Trash2, Plus, Clock, CreditCard,
  MessageCircle, CheckCircle2, XCircle, Bell, FileText,
  ChevronRight, ChevronDown, DollarSign, User, ExternalLink,
} from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { usePaymentsStore } from "@/store/payments";
import { useCommunicationStore } from "@/store/communication";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePayment } from "@/hooks/useCreatePayment";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BookingForm } from "@/components/modules/bookings/BookingForm";

type Tab = "overview" | "bookings" | "payments" | "conversations" | "activity";

interface ClientDetailProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientDetail({ open, onClose, clientId }: ClientDetailProps) {
  const { getClient, deleteClient, updateClient } = useClientsStore();
  const { workspaceId } = useAuth();
  const { bookings } = useBookingsStore();
  const { services } = useServicesStore();
  const { members } = useTeamStore();
  const { documents } = usePaymentsStore();
  const { conversations, getMessages } = useCommunicationStore();
  const { createPayment } = useCreatePayment();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const client = clientId ? getClient(clientId) : undefined;

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const clientBookings = useMemo(
    () => clientId ? bookings.filter((b) => b.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)) : [],
    [bookings, clientId]
  );

  const clientPayments = useMemo(
    () => clientId ? documents.filter((d) => d.clientId === clientId).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")) : [],
    [documents, clientId]
  );

  const clientConversations = useMemo(
    () => clientId ? conversations.filter((c) => c.clientId === clientId) : [],
    [conversations, clientId]
  );

  const completedCount = useMemo(() => clientBookings.filter((b) => b.status === "completed").length, [clientBookings]);
  const totalSpend = useMemo(() => clientPayments.filter((d) => d.status === "paid").reduce((s, d) => s + d.total, 0), [clientPayments]);

  const lastBooking = useMemo(
    () => clientBookings.find((b) => b.status === "completed"),
    [clientBookings]
  );
  const nextBooking = useMemo(
    () => {
      const today = new Date().toISOString().split("T")[0];
      return [...clientBookings].reverse().find((b) => (b.status === "confirmed" || b.status === "pending") && b.date >= today);
    },
    [clientBookings]
  );

  // Build activity timeline from all related data
  const activityEvents = useMemo(() => {
    if (!clientId) return [];
    type Event = { time: string; label: string; detail?: string; color: string; icon: typeof Calendar };
    const events: Event[] = [];

    // Client created
    if (client) {
      events.push({ time: client.createdAt, label: "Client record created", color: "bg-blue-500", icon: User });
    }

    // Bookings
    for (const b of clientBookings) {
      const svc = b.serviceId ? serviceMap.get(b.serviceId)?.name : "Appointment";
      events.push({ time: b.createdAt, label: `Booking created`, detail: `${svc} on ${formatDateShort(b.date)}`, color: "bg-blue-500", icon: Calendar });

      if (b.status === "completed") {
        events.push({ time: b.updatedAt, label: "Appointment completed", detail: svc, color: "bg-emerald-500", icon: CheckCircle2 });
      }
      if (b.status === "cancelled") {
        events.push({ time: b.updatedAt, label: "Booking cancelled", detail: b.cancellationReason || svc, color: "bg-red-500", icon: XCircle });
      }
      if (b.status === "no_show") {
        events.push({ time: b.updatedAt, label: "No-show", detail: svc, color: "bg-red-500", icon: XCircle });
      }
      if (b.reminderSentAt) {
        events.push({ time: b.reminderSentAt, label: "Reminder sent", detail: svc, color: "bg-violet-500", icon: Bell });
      }
      if (b.followupSentAt) {
        events.push({ time: b.followupSentAt, label: "Follow-up sent", detail: svc, color: "bg-violet-500", icon: Bell });
      }
      if (b.reviewRequestSentAt) {
        events.push({ time: b.reviewRequestSentAt, label: "Review request sent", color: "bg-amber-500", icon: Bell });
      }
    }

    // Payments
    for (const d of clientPayments) {
      events.push({ time: d.createdAt, label: `${d.label === "quote" ? "Quote" : "Invoice"} ${d.documentNumber} created`, detail: `$${d.total}`, color: "bg-blue-500", icon: FileText });
      if (d.sentAt) {
        events.push({ time: d.sentAt, label: `${d.documentNumber} sent to client`, color: "bg-violet-500", icon: Mail });
      }
      if (d.paidAt) {
        events.push({ time: d.paidAt, label: `${d.documentNumber} paid`, detail: `$${d.total} via ${d.paymentMethod?.replace("_", " ") || "unknown"}`, color: "bg-emerald-500", icon: DollarSign });
      }
    }

    // Conversations
    for (const c of clientConversations) {
      events.push({ time: c.createdAt, label: `Conversation started`, detail: `via ${c.channel}`, color: "bg-blue-500", icon: MessageCircle });
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return events;
  }, [clientId, client, clientBookings, clientPayments, clientConversations, serviceMap]);

  if (!client) {
    return (
      <SlideOver open={open} onClose={onClose} title="Client Details">
        <p className="text-text-secondary text-sm">Client not found.</p>
      </SlideOver>
    );
  }

  const handleDelete = () => {
    deleteClient(client.id, workspaceId ?? undefined);
    onClose();
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "bookings", label: "Bookings", count: clientBookings.length },
    { key: "payments", label: "Payments", count: clientPayments.length },
    { key: "conversations", label: "Messages", count: clientConversations.length },
    { key: "activity", label: "Activity", count: activityEvents.length },
  ];

  return (
    <>
      <SlideOver open={open} onClose={onClose} title="">
        <div className="-mt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <InlineField value={client.name} field="name" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} className="text-xl font-bold text-foreground tracking-tight" />
              <p className="text-[12px] text-text-secondary mt-0.5">Client since {formatDateShort(client.createdAt)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4">
            <div className="bg-surface rounded-lg p-2.5 border border-border-light text-center">
              <p className="text-[16px] font-bold text-foreground">{completedCount}</p>
              <p className="text-[10px] text-text-tertiary">Visits</p>
            </div>
            <div className="bg-surface rounded-lg p-2.5 border border-border-light text-center">
              <p className="text-[16px] font-bold text-foreground">${totalSpend.toLocaleString()}</p>
              <p className="text-[10px] text-text-tertiary">Total Spend</p>
            </div>
            <div className="bg-surface rounded-lg p-2.5 border border-border-light text-center">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {nextBooking ? (serviceMap.get(nextBooking.serviceId || "")?.name || "Booked") : "—"}
              </p>
              <p className="text-[10px] text-text-tertiary">
                {nextBooking ? `Next: ${formatDateShort(nextBooking.date)}` : "No upcoming"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 border-b border-border-light mb-4 -mx-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 sm:px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-text-tertiary hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className="ml-1 text-[10px] text-text-tertiary">{tab.count}</span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === "overview" && (
              <>
                {/* Contact — click to edit */}
                <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Contact</h4>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <InlineField value={client.email} field="email" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="Add email" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <InlineField value={client.phone} field="phone" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="Add phone" />
                  </div>
                </div>

                {/* Medical Alerts */}
                {client.medicalAlerts && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-[12px] font-semibold text-red-700 uppercase tracking-wider mb-1">⚠ Medical Alert</h4>
                    <InlineField value={client.medicalAlerts || ""} field="medicalAlerts" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="Add allergies or medical conditions..." className="text-[13px] text-red-800" />
                  </div>
                )}

                {/* Profile Details */}
                <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Profile</h4>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <InlineField value={client.birthday || ""} field="birthday" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="Add birthday (DD/MM)" />
                  </div>
                  {!client.medicalAlerts && (
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 text-text-secondary flex-shrink-0 text-center text-[12px]">⚠</span>
                      <InlineField value={client.medicalAlerts || ""} field="medicalAlerts" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="Add allergies / medical alerts" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <InlineField value={client.source || ""} field="source" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="How did they find you?" />
                  </div>
                </div>

                {/* Notes — click to edit */}
                <div className="bg-surface rounded-lg p-4 border border-border-light">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Notes</h4>
                  <InlineField value={client.notes} field="notes" clientId={client.id} updateClient={updateClient} workspaceId={workspaceId} placeholder="Click to add notes..." multiline />
                </div>

                {/* Quick Actions */}
                <div className="bg-surface rounded-lg p-4 border border-border-light">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Quick Actions</h4>
                  <div className="space-y-1">
                    <button onClick={() => setBookingFormOpen(true)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                      <Plus className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                      <span>Book Appointment</span>
                    </button>
                    {lastBooking && (
                      <button onClick={() => setBookingFormOpen(true)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                        <Calendar className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                        <span className="truncate">Rebook: {serviceMap.get(lastBooking.serviceId || "")?.name || "Appointment"}</span>
                      </button>
                    )}
                    <button onClick={() => {
                      createPayment({ clientId: client.id, clientName: client.name, label: "quote" });
                    }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                      <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                      <span>Send Quote</span>
                    </button>
                    <button onClick={() => {
                      createPayment({ clientId: client.id, clientName: client.name, label: "invoice" });
                    }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                      <CreditCard className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                      <span>Send Invoice</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "bookings" && (
              <div className="space-y-2">
                {clientBookings.length === 0 ? (
                  <p className="text-[13px] text-text-tertiary text-center py-8">No bookings yet.</p>
                ) : clientBookings.map((b) => {
                  const svc = b.serviceId ? serviceMap.get(b.serviceId) : null;
                  const member = b.assignedToId ? memberMap.get(b.assignedToId) : null;
                  const isExpanded = expandedBookingId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                      className="w-full bg-surface rounded-lg border border-border-light text-left cursor-pointer hover:border-foreground/10 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 p-3.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-foreground">{svc?.name || "Appointment"}</p>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {formatDateShort(b.date)} · {formatTimeShort(b.startAt)} – {formatTimeShort(b.endAt)}
                          </p>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
                      </div>
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 border-t border-border-light pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[11px]">
                            {svc && <div className="bg-card-bg rounded-lg p-2 text-center"><p className="font-bold text-foreground">${svc.price}</p><p className="text-text-tertiary">Price</p></div>}
                            {svc && <div className="bg-card-bg rounded-lg p-2 text-center"><p className="font-bold text-foreground">{svc.duration}m</p><p className="text-text-tertiary">Duration</p></div>}
                            {member && <div className="bg-card-bg rounded-lg p-2 text-center"><p className="font-bold text-foreground truncate">{member.name}</p><p className="text-text-tertiary">Stylist</p></div>}
                          </div>
                          {b.notes && <p className="text-[11px] text-text-secondary bg-card-bg rounded-lg px-2.5 py-2">{b.notes}</p>}
                          {b.reminderSentAt && <p className="text-[10px] text-blue-600 flex items-center gap-1"><Bell className="w-3 h-3" /> Reminder sent {formatDateShort(b.reminderSentAt)}</p>}
                          <button
                            onClick={(e) => { e.stopPropagation(); onClose(); router.push("/dashboard/bookings"); }}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" /> View in Bookings
                          </button>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-2">
                {clientPayments.length === 0 ? (
                  <p className="text-[13px] text-text-tertiary text-center py-8">No payment documents.</p>
                ) : clientPayments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { onClose(); router.push("/dashboard/payments"); }}
                    className="w-full bg-surface rounded-lg p-3.5 border border-border-light flex items-center justify-between cursor-pointer hover:border-foreground/10 hover:shadow-sm transition-all text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-foreground">{d.documentNumber}</p>
                        <span className="text-[10px] font-medium text-text-tertiary uppercase bg-card-bg px-1.5 py-0.5 rounded">{d.label}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {formatDateShort(d.createdAt)}
                        {d.paidAt && ` · Paid ${formatDateShort(d.paidAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-foreground">${d.total.toLocaleString()}</p>
                        <StatusBadge status={d.status} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "conversations" && (
              <div className="space-y-2">
                {clientConversations.length === 0 ? (
                  <p className="text-[13px] text-text-tertiary text-center py-8">No conversations linked.</p>
                ) : clientConversations.map((c) => {
                  const msgs = getMessages(c.id);
                  const lastMsg = msgs[msgs.length - 1];
                  const channelColors: Record<string, string> = { instagram: "bg-pink-100 text-pink-600", whatsapp: "bg-emerald-100 text-emerald-600", facebook: "bg-blue-100 text-blue-600", email: "bg-gray-100 text-gray-600" };
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onClose(); router.push("/dashboard/communications"); }}
                      className="w-full bg-surface rounded-lg p-3.5 border border-border-light cursor-pointer hover:border-foreground/10 hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-text-secondary" />
                          <p className="text-[13px] font-medium text-foreground">{c.contactName || "Conversation"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${channelColors[c.channel] || "bg-gray-100 text-gray-600"}`}>
                            {c.channel}
                          </span>
                          <ChevronRight className="w-4 h-4 text-text-tertiary" />
                        </div>
                      </div>
                      {lastMsg && (
                        <p className="text-[11px] text-text-secondary truncate pl-6">
                          {lastMsg.sender === "user" ? "You: " : ""}{lastMsg.content}
                        </p>
                      )}
                      <p className="text-[10px] text-text-tertiary mt-1 pl-6">{msgs.length} messages · Last: {c.lastMessageAt ? formatDateShort(c.lastMessageAt) : "—"}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border-light" />

                {activityEvents.length === 0 ? (
                  <p className="text-[13px] text-text-tertiary text-center py-8">No activity yet.</p>
                ) : activityEvents.map((ev, i) => {
                  const Icon = ev.icon;
                  return (
                    <div key={i} className="relative flex items-start gap-3 py-2.5">
                      <div className={`w-[18px] h-[18px] rounded-full ${ev.color} flex items-center justify-center flex-shrink-0 -ml-[15px] z-10`}>
                        <Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground">{ev.label}</p>
                        {ev.detail && <p className="text-[11px] text-text-secondary">{ev.detail}</p>}
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          {formatDateShort(ev.time)} at {formatTimeShort(ev.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${client.name}"? ${clientBookings.length > 0 ? `This client has ${clientBookings.length} bookings linked.` : ""}`}
      />

      <BookingForm
        open={bookingFormOpen}
        onClose={() => setBookingFormOpen(false)}
        defaultDate={new Date().toISOString().split("T")[0]}
        prefill={{ clientId: client.id }}
      />
    </>
  );
}

// ── Helpers ──

function formatDateShort(iso: string) {
  return new Date(iso.includes("T") ? iso : iso + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimeShort(iso: string) {
  if (iso.includes("T")) {
    return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
  }
  return iso;
}

// ── Inline editable field ──

function InlineField({
  value,
  field,
  clientId,
  updateClient,
  workspaceId,
  placeholder,
  multiline,
  className,
}: {
  value: string;
  field: string;
  clientId: string;
  updateClient: (id: string, data: Record<string, unknown>, wsId?: string) => void;
  workspaceId: string | null;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    if (draft !== value) {
      updateClient(clientId, { [field]: draft }, workspaceId ?? undefined);
    }
    setEditing(false);
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          rows={3}
          className="w-full text-[13px] text-foreground bg-card-bg border border-primary/30 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary/30 resize-none"
        />
      );
    }
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className={`bg-transparent border-b-2 border-primary/30 outline-none text-foreground w-full ${className || "text-[13px]"}`}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 transition-colors ${className || "text-[13px] text-foreground"} ${!value ? "italic text-text-tertiary" : ""}`}
    >
      {value || placeholder || "Click to edit"}
    </span>
  );
}
