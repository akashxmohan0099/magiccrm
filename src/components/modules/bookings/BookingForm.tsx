"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { Booking, BookingStatus } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking;
  defaultDate?: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const recurringOptions = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

const emptyForm = {
  title: "",
  clientId: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  status: "pending" as BookingStatus,
  notes: "",
  recurring: "none",
};

export function BookingForm({ open, onClose, booking, defaultDate }: BookingFormProps) {
  const { addBooking, updateBooking, deleteBooking, hasConflict } = useBookingsStore();
  const { clients } = useClientsStore();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const clientOptions = useMemo(
    () => [
      { value: "", label: "No client" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  );

  useEffect(() => {
    if (open) {
      if (booking) {
        setForm({
          title: booking.title,
          clientId: booking.clientId ?? "",
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          notes: booking.notes,
          recurring: booking.recurring ?? "none",
        });
      } else {
        setForm({
          ...emptyForm,
          date: defaultDate ?? "",
        });
      }
      setErrors({});
    }
  }, [open, booking, defaultDate]);

  const conflictDetected = useMemo(() => {
    if (!form.date || !form.startTime || !form.endTime) return false;
    return hasConflict(form.date, form.startTime, form.endTime, booking?.id);
  }, [form.date, form.startTime, form.endTime, booking?.id, hasConflict]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.date) errs.date = "Date is required";
    if (!form.startTime) errs.startTime = "Start time is required";
    if (!form.endTime) errs.endTime = "End time is required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errs.endTime = "End time must be after start time";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    const data = {
      title: form.title.trim(),
      clientId: form.clientId || undefined,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      status: form.status,
      notes: form.notes.trim(),
      recurring: form.recurring === "none" ? undefined : (form.recurring as Booking["recurring"]),
    };

    if (booking) {
      updateBooking(booking.id, data);
    } else {
      addBooking(data as Omit<Booking, "id" | "createdAt" | "updatedAt">);
    }

    onClose();
    setSaving(false);
  };

  const handleDelete = () => {
    if (booking) {
      deleteBooking(booking.id);
      onClose();
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={booking ? "Edit Booking" : "New Booking"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Booking title"
          />
        </FormField>

        <FormField label="Client">
          <SelectField
            options={clientOptions}
            value={form.clientId}
            onChange={(e) => set("clientId", e.target.value)}
          />
        </FormField>

        <FormField label="Date" required error={errors.date}>
          <DateField
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            allowPast={false}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Time" required error={errors.startTime}>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </FormField>

          <FormField label="End Time" required error={errors.endTime}>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </FormField>
        </div>

        {conflictDetected && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This time slot conflicts with an existing booking.</span>
          </div>
        )}

        <FormField label="Status">
          <SelectField
            options={statusOptions}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          />
        </FormField>

        <FormField label="Recurring">
          <SelectField
            options={recurringOptions}
            value={form.recurring}
            onChange={(e) => set("recurring", e.target.value)}
          />
        </FormField>

        <FormField label="Notes">
          <TextArea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
          />
        </FormField>

        <div className="flex justify-between pt-4 border-t border-border-light">
          <div>
            {booking && (
              <Button variant="secondary" size="sm" type="button" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {booking ? "Save Changes" : "Create Booking"}
            </Button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
