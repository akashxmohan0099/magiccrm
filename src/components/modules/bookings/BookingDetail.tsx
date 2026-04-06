"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Bell,
  Pencil,
  Receipt,
} from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useInvoicesStore } from "@/store/invoices";
import { useAuth } from "@/hooks/useAuth";
import { useVocabulary } from "@/hooks/useVocabulary";
import { Booking } from "@/types/models";
import { generateId } from "@/lib/id";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface BookingDetailProps {
  open: boolean;
  onClose: () => void;
  bookingId: string | null;
  onEdit: (booking: Booking) => void;
}

export function BookingDetail({ open, onClose, bookingId, onEdit }: BookingDetailProps) {
  const { bookings, updateBooking, deleteBooking } = useBookingsStore();
  const { clients } = useClientsStore();
  const { invoices, addInvoice } = useInvoicesStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const booking = useMemo(
    () => bookings.find((b) => b.id === bookingId),
    [bookings, bookingId]
  );

  const clientName = useMemo(() => {
    if (!booking?.clientId) return undefined;
    return clients.find((c) => c.id === booking.clientId)?.name;
  }, [clients, booking?.clientId]);

  if (!booking) {
    return (
      <SlideOver open={open} onClose={onClose} title="Booking Details">
        <p className="text-text-secondary text-sm">Booking not found.</p>
      </SlideOver>
    );
  }

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string) => {
    if (booking) {
      updateBooking(booking.id, { [field]: editValue }, workspaceId ?? undefined);
    }
    setEditingField(null);
  };

  const handleMarkComplete = () => {
    updateBooking(booking.id, { status: "completed" }, workspaceId ?? undefined);
    setCompleteOpen(false);
  };

  const handleCancelBooking = () => {
    updateBooking(booking.id, { status: "cancelled" }, workspaceId ?? undefined);
    setCancelOpen(false);
  };

  const handleSendReminder = () => {
    updateBooking(
      booking.id,
      { reminderSentAt: new Date().toISOString() },
      workspaceId ?? undefined
    );
  };

  const handleDelete = () => {
    deleteBooking(booking.id, workspaceId ?? undefined);
    setDeleteOpen(false);
    onClose();
  };

  // Check if an invoice already exists for this booking's client + service
  const invoiceExists = useMemo(() => {
    if (!booking?.clientId || !booking?.serviceName) return false;
    return invoices.some(
      (inv) =>
        inv.clientId === booking.clientId &&
        inv.lineItems?.some((li) => li.description === booking.serviceName)
    );
  }, [invoices, booking?.clientId, booking?.serviceName]);

  const handleCreateInvoice = () => {
    if (!booking?.clientId) return;
    addInvoice(
      {
        clientId: booking.clientId,
        lineItems: [
          {
            id: generateId(),
            description: booking.serviceName || booking.title,
            quantity: 1,
            unitPrice: booking.price ?? 0,
          },
        ],
        status: "draft",
        notes: "",
      },
      workspaceId ?? undefined
    );
  };

  // Header display: "Service — Client" or just title
  const headerTitle = booking.serviceName && clientName
    ? `${booking.serviceName} — ${clientName}`
    : booking.title;

  const formattedDate = new Date(booking.date + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const durationMinutes = booking.duration
    ?? (() => {
      const [sh, sm] = booking.startTime.split(":").map(Number);
      const [eh, em] = booking.endTime.split(":").map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    })();

  const infoRow = (
    icon: React.ReactNode,
    label: string,
    value: string | undefined,
    field?: string
  ) => (
    <div
      className={`flex items-start gap-3 py-2 ${field ? "cursor-pointer hover:bg-surface/80 -mx-2 px-2 rounded-lg transition-colors" : ""}`}
      onClick={() => field && value !== undefined && startEdit(field, value || "")}
    >
      <span className="text-text-secondary mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        {field && editingField === field ? (
          field === "notes" ? (
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(field)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingField(null);
              }}
              rows={3}
              className="text-sm text-foreground bg-transparent border border-primary/40 rounded-lg outline-none w-full py-1 px-1.5 resize-none"
            />
          ) : field === "date" ? (
            <input
              autoFocus
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(field)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingField(null);
              }}
              className="text-sm text-foreground bg-transparent border-b border-primary/40 outline-none w-full py-0.5"
            />
          ) : field === "price" ? (
            <input
              autoFocus
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                updateBooking(booking.id, { price: parseFloat(editValue) || 0 }, workspaceId ?? undefined);
                setEditingField(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateBooking(booking.id, { price: parseFloat(editValue) || 0 }, workspaceId ?? undefined);
                  setEditingField(null);
                }
                if (e.key === "Escape") setEditingField(null);
              }}
              className="text-sm text-foreground bg-transparent border-b border-primary/40 outline-none w-full py-0.5"
            />
          ) : (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(field)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(field);
                if (e.key === "Escape") setEditingField(null);
              }}
              className="text-sm text-foreground bg-transparent border-b border-primary/40 outline-none w-full py-0.5"
            />
          )
        ) : (
          <p className="text-sm text-foreground">
            {value || <span className="text-text-tertiary italic">Add {label.toLowerCase()}</span>}
          </p>
        )}
      </div>
    </div>
  );

  const isTerminal = booking.status === "completed" || booking.status === "cancelled";

  return (
    <>
      <SlideOver open={open} onClose={onClose} title="Booking Details">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground tracking-tight">
                {headerTitle}
              </h3>
              <div className="mt-2">
                <StatusBadge status={booking.status} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(booking)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface rounded-lg p-3 border border-border-light text-center">
              <p className="text-[18px] font-bold text-foreground">
                {booking.price != null ? `$${booking.price}` : "—"}
              </p>
              <p className="text-[10px] text-text-tertiary">Price</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-border-light text-center">
              <p className="text-[18px] font-bold text-foreground">
                {durationMinutes > 0 ? `${durationMinutes}m` : "—"}
              </p>
              <p className="text-[10px] text-text-tertiary">Duration</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-border-light text-center">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {booking.serviceName || "—"}
              </p>
              <p className="text-[10px] text-text-tertiary">Service</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Details
            </h4>
            {infoRow(
              <Calendar className="w-4 h-4" />,
              "Date",
              booking.date,
              "date"
            )}
            {infoRow(
              <Clock className="w-4 h-4" />,
              "Time",
              `${booking.startTime} – ${booking.endTime}`
            )}
            {infoRow(
              <User className="w-4 h-4" />,
              vocab.client,
              clientName || (booking.clientId ? "Unknown client" : undefined)
            )}
            {infoRow(
              <Scissors className="w-4 h-4" />,
              "Service",
              booking.serviceName || undefined,
              "serviceName"
            )}
            {infoRow(
              <DollarSign className="w-4 h-4" />,
              "Price",
              booking.price != null ? `$${booking.price}` : undefined,
              "price"
            )}
            {booking.assignedToName &&
              infoRow(
                <User className="w-4 h-4" />,
                "Assigned To",
                booking.assignedToName
              )}
          </div>

          {/* Notes */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
            {infoRow(
              <FileText className="w-4 h-4" />,
              "Notes",
              booking.notes || undefined,
              "notes"
            )}
          </div>

          {/* Reminder Status */}
          {booking.reminderSentAt && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                Reminder sent {new Date(booking.reminderSentAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Actions
            </h4>
            <div className="space-y-2">
              {booking.status === "confirmed" && (
                <button
                  onClick={() => setCompleteOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-card-bg border border-transparent hover:border-border-light transition-all group w-full text-left cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-text-secondary group-hover:text-emerald-500 transition-colors" />
                  <span>Mark Complete</span>
                </button>
              )}
              {!isTerminal && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-card-bg border border-transparent hover:border-border-light transition-all group w-full text-left cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-text-secondary group-hover:text-red-500 transition-colors" />
                  <span>Cancel Booking</span>
                </button>
              )}
              {!isTerminal && (
                <button
                  onClick={handleSendReminder}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-card-bg border border-transparent hover:border-border-light transition-all group w-full text-left cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                  <span>Send Reminder</span>
                </button>
              )}
              {(booking.status === "completed" || booking.status === "confirmed") && (
                invoiceExists ? (
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-text-tertiary w-full text-left">
                    <Receipt className="w-4 h-4" />
                    <span>Invoice exists</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateInvoice}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-card-bg border border-transparent hover:border-border-light transition-all group w-full text-left cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                    <span>Create Invoice</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Satisfaction Rating (if completed) */}
          {booking.status === "completed" && booking.satisfactionRating && (
            <div className="bg-surface rounded-lg p-4 border border-border-light">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Satisfaction
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {booking.satisfactionRating}/5
                </span>
                {booking.satisfactionFeedback && (
                  <span className="text-sm text-text-secondary">
                    — {booking.satisfactionFeedback}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-[11px] text-text-tertiary space-y-0.5 pt-2">
            <p>Created: {new Date(booking.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(booking.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </SlideOver>

      {/* Confirm: Delete */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Booking"
        message={`Are you sure you want to delete "${booking.title}"? This action cannot be undone.`}
      />

      {/* Confirm: Cancel */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        message={`Are you sure you want to cancel "${booking.title}"?`}
        confirmLabel="Cancel Booking"
      />

      {/* Confirm: Complete */}
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleMarkComplete}
        title="Mark as Complete"
        message={`Mark "${booking.title}" as completed?`}
        confirmLabel="Mark Complete"
      />
    </>
  );
}
