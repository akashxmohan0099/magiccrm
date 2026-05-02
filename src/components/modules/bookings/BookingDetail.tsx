"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, User, Scissors, DollarSign, FileText,
  Trash2, CheckCircle2, XCircle, Bell, Mail, CreditCard, MapPin,
} from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { usePaymentsStore } from "@/store/payments";
import { useCommunicationStore } from "@/store/communication";
import { useLocationsStore } from "@/store/locations";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePayment } from "@/hooks/useCreatePayment";
import { Booking } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { useMoney } from "@/lib/format/money";

type Tab = "overview" | "activity" | "payment" | "actions";

interface BookingDetailProps {
  open: boolean;
  onClose: () => void;
  bookingId: string | null;
  onEdit: (booking: Booking) => void;
}

export function BookingDetail({ open, onClose, bookingId }: BookingDetailProps) {
  const { bookings, updateBooking, deleteBooking } = useBookingsStore();
  const { clients } = useClientsStore();
  const { services } = useServicesStore();
  const { members } = useTeamStore();
  const { documents } = usePaymentsStore();
  const { conversations } = useCommunicationStore();
  const money = useMoney();
  const { locations } = useLocationsStore();
  const { workspaceId } = useAuth();
  const { createPayment } = useCreatePayment();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  const booking = bookings.find((b) => b.id === bookingId);
  const client = booking?.clientId
    ? clients.find((c) => c.id === booking.clientId) ?? null
    : null;
  const service = booking?.serviceId
    ? services.find((s) => s.id === booking.serviceId) ?? null
    : null;
  const assignedTo = booking?.assignedToId
    ? members.find((m) => m.id === booking.assignedToId) ?? null
    : null;
  const linkedPayment = booking
    ? documents.find((d) => d.bookingId === booking.id) ?? null
    : null;
  const linkedConversation = booking?.conversationId
    ? conversations.find((c) => c.id === booking.conversationId) ?? null
    : null;
  const bookingLocation = booking?.locationId
    ? locations.find((l) => l.id === booking.locationId) ?? null
    : null;

  // Activity events
  const activityEvents = useMemo(() => {
    if (!booking) return [];
    type Ev = { time: string; label: string; detail?: string; color: string; icon: typeof Calendar };
    const events: Ev[] = [];

    events.push({ time: booking.createdAt, label: "Booking created", detail: service?.name, color: "bg-blue-500", icon: Calendar });

    if (booking.status === "confirmed" && booking.createdAt !== booking.updatedAt) {
      events.push({ time: booking.updatedAt, label: "Booking confirmed", color: "bg-emerald-500", icon: CheckCircle2 });
    }
    if (booking.reminderSentAt) {
      events.push({ time: booking.reminderSentAt, label: "Reminder sent to client", color: "bg-violet-500", icon: Bell });
    }
    if (booking.status === "completed") {
      events.push({ time: booking.updatedAt, label: "Marked as completed", color: "bg-emerald-600", icon: CheckCircle2 });
    }
    if (booking.followupSentAt) {
      events.push({ time: booking.followupSentAt, label: "Follow-up sent", color: "bg-violet-500", icon: Bell });
    }
    if (booking.reviewRequestSentAt) {
      events.push({ time: booking.reviewRequestSentAt, label: "Review request sent", color: "bg-amber-500", icon: Bell });
    }
    if (booking.status === "cancelled") {
      events.push({ time: booking.updatedAt, label: "Booking cancelled", detail: booking.cancellationReason || undefined, color: "bg-red-500", icon: XCircle });
    }
    if (booking.status === "no_show") {
      events.push({ time: booking.updatedAt, label: "Marked as no-show", color: "bg-red-500", icon: XCircle });
    }

    // Payment events
    if (linkedPayment) {
      events.push({ time: linkedPayment.createdAt, label: `${linkedPayment.documentNumber} created`, detail: money.format(linkedPayment.total, { withDecimals: true }), color: "bg-blue-500", icon: FileText });
      if (linkedPayment.sentAt) {
        events.push({ time: linkedPayment.sentAt, label: `${linkedPayment.documentNumber} sent`, color: "bg-violet-500", icon: Mail });
      }
      if (linkedPayment.paidAt) {
        events.push({ time: linkedPayment.paidAt, label: `${linkedPayment.documentNumber} paid`, detail: money.format(linkedPayment.total, { withDecimals: true }), color: "bg-emerald-500", icon: DollarSign });
      }
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return events;
  }, [booking, service, linkedPayment, money]);

  if (!booking) {
    return (
      <SlideOver open={open} onClose={onClose} title="Booking Details">
        <p className="text-text-secondary text-sm">Booking not found.</p>
      </SlideOver>
    );
  }

  const isTerminal = booking.status === "completed" || booking.status === "cancelled";
  const fmt = (iso: string) => new Date(iso.includes("T") ? iso : iso + "T00:00:00").toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso: string) => new Date(iso.includes("T") ? iso : iso + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activity", count: activityEvents.length },
    { key: "payment", label: "Payment" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <>
      <SlideOver open={open} onClose={onClose} title="">
        <div className="-mt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                {service?.name || "Booking"} — {client?.name || "Client"}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={booking.status} />
                <span className="text-[12px] text-text-tertiary">
                  {fmtDate(booking.date)} · {fmt(booking.startAt)} – {fmt(booking.endAt)}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-surface rounded-lg p-2.5 border border-border-light text-center">
              <p className="text-[16px] font-bold text-foreground">${service?.price ?? "—"}</p>
              <p className="text-[10px] text-text-tertiary">Price</p>
            </div>
            <div className="bg-surface rounded-lg p-2.5 border border-border-light text-center">
              <p className="text-[16px] font-bold text-foreground">{service?.duration ?? "—"}m</p>
              <p className="text-[10px] text-text-tertiary">Duration</p>
            </div>
            <div className="bg-surface rounded-lg p-2.5 border border-border-light text-center">
              <p className="text-[13px] font-semibold text-foreground truncate">{assignedTo?.name ?? "Unassigned"}</p>
              <p className="text-[10px] text-text-tertiary">Stylist</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 border-b border-border-light mb-4 -mx-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer relative ${
                  activeTab === tab.key ? "text-foreground" : "text-text-tertiary hover:text-foreground"
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

          {/* Tab content */}
          <div className="space-y-4">
            {activeTab === "overview" && (
              <>
                {/* Details — all fields editable inline */}
                <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Details</h4>
                  {/* Date — click to change */}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] text-text-tertiary">Date</p>
                      <input type="date" value={booking.date}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const oldStart = new Date(booking.startAt);
                          const oldEnd = new Date(booking.endAt);
                          const [y, m, d] = e.target.value.split("-").map(Number);
                          const ns = new Date(oldStart); ns.setFullYear(y, m - 1, d);
                          const ne = new Date(oldEnd); ne.setFullYear(y, m - 1, d);
                          updateBooking(booking.id, { date: e.target.value, startAt: ns.toISOString(), endAt: ne.toISOString() }, workspaceId ?? undefined);
                        }}
                        className="text-[13px] text-foreground bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors" />
                    </div>
                  </div>
                  {/* Time */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-text-tertiary">Time</p>
                      <p className="text-[13px] text-foreground">{fmt(booking.startAt)} – {fmt(booking.endAt)}</p>
                    </div>
                  </div>
                  {/* Client */}
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-text-tertiary">Client</p>
                      <p onClick={() => {
                        if (!client) return;
                        onClose();
                        router.push(`/dashboard/clients?client=${client.id}`);
                        toast(`Viewing ${client.name}`);
                      }}
                        className="text-[13px] text-primary font-medium cursor-pointer hover:underline">{client?.name || "—"}</p>
                    </div>
                  </div>
                  {/* Service — dropdown to change. Extras (additionalServiceIds)
                      are shown as read-only chips beneath the primary picker;
                      use the booking form's service basket to edit them. */}
                  <div className="flex items-center gap-3">
                    <Scissors className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] text-text-tertiary">Service</p>
                      <select value={booking.serviceId || ""}
                        onChange={(e) => updateBooking(booking.id, { serviceId: e.target.value || undefined }, workspaceId ?? undefined)}
                        className="text-[13px] text-foreground bg-transparent border-none outline-none cursor-pointer hover:text-primary appearance-none pr-4 transition-colors"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}>
                        <option value="">No service</option>
                        {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      {booking.additionalServiceIds && booking.additionalServiceIds.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {booking.additionalServiceIds.map((id) => {
                            const svc = services.find((s) => s.id === id);
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface border border-border-light text-[11px] text-text-secondary"
                              >
                                + {svc?.name ?? "Unknown service"}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Assigned To — dropdown to reassign */}
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] text-text-tertiary">Assigned To</p>
                      <select value={booking.assignedToId || ""}
                        onChange={(e) => updateBooking(booking.id, { assignedToId: e.target.value || undefined }, workspaceId ?? undefined)}
                        className="text-[13px] text-foreground bg-transparent border-none outline-none cursor-pointer hover:text-primary appearance-none pr-4 transition-colors"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}>
                        <option value="">Unassigned</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Status — dropdown to change */}
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] text-text-tertiary">Status</p>
                      <select value={booking.status}
                        onChange={(e) => {
                          const updates: Partial<typeof booking> = { status: e.target.value as typeof booking.status };
                          if (e.target.value === "completed") updates.status = "completed";
                          if (e.target.value === "cancelled") updates.status = "cancelled";
                          updateBooking(booking.id, updates, workspaceId ?? undefined);
                        }}
                        className="text-[13px] text-foreground bg-transparent border-none outline-none cursor-pointer hover:text-primary appearance-none pr-4 transition-colors"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </div>
                  </div>
                  {(bookingLocation || booking.address) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-text-tertiary">Location</p>
                        {bookingLocation && (
                          <p className="text-[13px] text-foreground truncate">{bookingLocation.name}</p>
                        )}
                        {(booking.address || bookingLocation?.address) && (
                          <p className="text-[12px] text-text-secondary truncate">
                            {booking.address || bookingLocation?.address}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes — click to edit */}
                <div className="bg-surface rounded-lg p-4 border border-border-light">
                  <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Notes</h4>
                  {editingNotes ? (
                    <div>
                      <textarea autoFocus value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={3}
                        onBlur={() => { updateBooking(booking.id, { notes: notesValue }, workspaceId ?? undefined); setEditingNotes(false); }}
                        onKeyDown={(e) => { if (e.key === "Escape") setEditingNotes(false); }}
                        className="w-full text-[13px] text-foreground bg-card-bg border border-primary/30 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary/30 resize-none" />
                    </div>
                  ) : (
                    <p onClick={() => { setEditingNotes(true); setNotesValue(booking.notes || ""); }}
                      className="text-[13px] text-text-secondary whitespace-pre-wrap cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 py-0.5 transition-colors">
                      {booking.notes || <span className="italic text-text-tertiary">Click to add notes...</span>}
                    </p>
                  )}
                </div>

                {/* Linked conversation */}
                {linkedConversation && (
                  <div className="flex items-center gap-2 text-[12px] text-text-secondary bg-surface rounded-lg px-3 py-2.5 border border-border-light">
                    <Mail className="w-3.5 h-3.5" />
                    Created from conversation with {linkedConversation.contactName} via {linkedConversation.channel}
                  </div>
                )}
              </>
            )}

            {activeTab === "activity" && (
              <div className="relative pl-6">
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
                          {fmtDate(ev.time)} at {new Date(ev.time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "payment" && (
              <div className="space-y-3">
                {linkedPayment ? (
                  <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-foreground">{linkedPayment.documentNumber}</p>
                        <span className="text-[10px] font-medium text-text-tertiary uppercase bg-card-bg px-1.5 py-0.5 rounded">{linkedPayment.label}</span>
                      </div>
                      <StatusBadge status={linkedPayment.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                      <div>
                        <p className="text-text-tertiary">Total</p>
                        <p className="text-foreground font-bold text-[16px]">${linkedPayment.total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">Due Date</p>
                        <p className="text-foreground">{linkedPayment.dueDate ? fmtDate(linkedPayment.dueDate) : "—"}</p>
                      </div>
                      {linkedPayment.paymentMethod && (
                        <div>
                          <p className="text-text-tertiary">Method</p>
                          <p className="text-foreground capitalize">{linkedPayment.paymentMethod.replace("_", " ")}</p>
                        </div>
                      )}
                      {linkedPayment.paidAt && (
                        <div>
                          <p className="text-text-tertiary">Paid On</p>
                          <p className="text-foreground">{fmtDate(linkedPayment.paidAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-lg p-8 border border-border-light text-center">
                    <DollarSign className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
                    <p className="text-[13px] text-text-tertiary">No payment document linked.</p>
                    <button
                      onClick={() => {
                        if (!booking.clientId) { toast("No client linked to this booking"); return; }
                        createPayment({ clientId: booking.clientId, clientName: client?.name, label: "invoice", bookingId: booking.id, serviceId: booking.serviceId });
                      }}
                      className="mt-2 text-[12px] text-primary font-medium hover:underline cursor-pointer"
                    >
                      Create Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "actions" && (
              <div className="bg-surface rounded-lg p-4 border border-border-light space-y-2">
                {booking.status === "confirmed" && (
                  <button onClick={() => setCompleteOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                    <CheckCircle2 className="w-4 h-4 text-text-secondary group-hover:text-emerald-500 transition-colors" />
                    <span>Mark Complete</span>
                  </button>
                )}
                {!isTerminal && (
                  <button onClick={() => setCancelOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                    <XCircle className="w-4 h-4 text-text-secondary group-hover:text-red-500 transition-colors" />
                    <span>Cancel Booking</span>
                  </button>
                )}
                {!linkedPayment && (
                  <button onClick={() => {
                    if (!booking.clientId) { toast("No client linked to this booking"); return; }
                    createPayment({ clientId: booking.clientId, clientName: client?.name, label: "invoice", bookingId: booking.id, serviceId: booking.serviceId });
                  }}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                    <CreditCard className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                    <span>Send Invoice</span>
                  </button>
                )}
                {!isTerminal && (
                  <button onClick={() => { updateBooking(booking.id, { reminderSentAt: new Date().toISOString() }, workspaceId ?? undefined); }}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                    <Bell className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                    <span>Send Reminder</span>
                  </button>
                )}
                {!booking.recurrencePattern && !isTerminal && (
                  <button onClick={() => {
                    updateBooking(booking.id, { recurrencePattern: "weekly" }, workspaceId ?? undefined);
                    toast("Recurring weekly — edit from booking details");
                  }}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                    <Calendar className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                    <span>Make Recurring</span>
                  </button>
                )}
                {booking.recurrencePattern && (
                  <div className="px-3 py-2 text-[12px] text-primary bg-primary/5 rounded-lg flex items-center justify-between">
                    <span>Recurring: {booking.recurrencePattern}</span>
                    <button onClick={() => updateBooking(booking.id, { recurrencePattern: undefined, recurrenceEndDate: undefined }, workspaceId ?? undefined)}
                      className="text-[11px] text-text-tertiary hover:text-red-500 cursor-pointer">Stop</button>
                  </div>
                )}
                <button onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Booking</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => { deleteBooking(booking.id, workspaceId ?? undefined); setDeleteOpen(false); onClose(); }}
        title="Delete Booking" message={`Are you sure you want to delete this booking${service ? ` (${service.name})` : ""}?`} />
      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => { updateBooking(booking.id, { status: "cancelled" }, workspaceId ?? undefined); setCancelOpen(false); }}
        title="Cancel Booking" message={`Cancel this booking${service ? ` (${service.name})` : ""}?`} confirmLabel="Cancel Booking" />
      <ConfirmDialog open={completeOpen} onClose={() => setCompleteOpen(false)} onConfirm={() => { updateBooking(booking.id, { status: "completed" }, workspaceId ?? undefined); setCompleteOpen(false); }}
        title="Mark as Complete" message={`Mark this booking as completed?`} confirmLabel="Mark Complete" />
    </>
  );
}
