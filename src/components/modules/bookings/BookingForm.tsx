"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { Booking, BookingStatus } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { ServicePicker } from "./ServicePicker";
import { FeatureSection } from "@/components/modules/FeatureSection";

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
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const isServiceMenu = config.bookingMode.defaultMode === "service-menu";
  const isRecurringLesson = config.bookingMode.defaultMode === "recurring-lesson";
  const isDateExclusive = config.bookingMode.defaultMode === "date-exclusive";
  const [form, setForm] = useState(emptyForm);
  const [selectedService, setSelectedService] = useState<{ id: string; name: string; duration: number; price: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [reminderHours, setReminderHours] = useState("24");
  const [noShow, setNoShow] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState("");
  const [resource, setResource] = useState("");

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
          recurring: isRecurringLesson ? "weekly" : "none",
        });
      }
      setErrors({});
      setSelectedService(null);
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
    if (!isDateExclusive) {
      if (!form.startTime) errs.startTime = "Start time is required";
      if (!form.endTime) errs.endTime = "End time is required";
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        errs.endTime = "End time must be after start time";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    const data: Record<string, unknown> = {
      title: form.title.trim(),
      clientId: form.clientId || undefined,
      date: form.date,
      startTime: isDateExclusive ? "00:00" : form.startTime,
      endTime: isDateExclusive ? "23:59" : form.endTime,
      status: form.status,
      notes: form.notes.trim(),
      recurring: form.recurring === "none" ? undefined : (form.recurring as Booking["recurring"]),
    };

    if (selectedService) {
      data.serviceId = selectedService.id;
      data.serviceName = selectedService.name;
      data.price = selectedService.price;
      data.duration = selectedService.duration;
    }

    if (booking) {
      updateBooking(booking.id, data as Partial<Booking>);
    } else {
      addBooking(data as unknown as Omit<Booking, "id" | "createdAt" | "updatedAt">);
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
      title={booking ? `Edit ${vocab.booking}` : vocab.addBooking}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service Picker for service-menu mode */}
        {(isServiceMenu || isRecurringLesson) && !booking && config.bookingMode.defaultServices && config.bookingMode.defaultServices.length > 0 && (
          <ServicePicker
            services={config.bookingMode.defaultServices}
            onSelect={(service) => {
              const startMinutes = parseInt(form.startTime.split(":")[0]) * 60 + parseInt(form.startTime.split(":")[1]);
              const endMinutes = startMinutes + service.duration;
              const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
              const endMins = String(endMinutes % 60).padStart(2, "0");
              setForm((f) => ({
                ...f,
                title: service.name,
                endTime: `${endHours}:${endMins}`,
              }));
              // Store service metadata for the booking record
              setSelectedService(service);
            }}
          />
        )}

        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder={`${vocab.booking} title`}
          />
        </FormField>

        <FormField label={vocab.client}>
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

        {!isDateExclusive && (
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
        )}

        {isDateExclusive && (
          <p className="text-xs text-text-tertiary">This is a full-day {vocab.booking.toLowerCase()}. No specific time required.</p>
        )}

        {conflictDetected && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This time slot conflicts with an existing booking.</span>
          </div>
        )}

        <FeatureSection moduleId="bookings-calendar" featureId="booking-deposits" featureLabel="Booking Deposits">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={requireDeposit} onChange={(e) => setRequireDeposit(e.target.checked)} className="rounded" />
              <span className="text-[13px] text-foreground">Require deposit</span>
            </label>
            {requireDeposit && (
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">Deposit Amount ($)</label>
                <input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
            )}
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="no-show-fees" featureLabel="No-Show Protection">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={noShow} onChange={(e) => setNoShow(e.target.checked)} className="rounded" />
            <span className="text-[13px] text-foreground">Mark as no-show</span>
          </label>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="group-class-booking" featureLabel="Group Booking">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Max Attendees</label>
            <input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="e.g. 10" className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
            <p className="text-[11px] text-text-tertiary mt-1">Leave empty for 1-on-1 appointments.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="resource-room-assignment" featureLabel="Room / Resource">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Room / Resource</label>
            <input type="text" value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g. Room 1, Chair 3" className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="booking-confirmation-flow" featureLabel="Booking Confirmation">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-[12px] text-blue-800">New bookings will land as "Pending" and need manual confirmation.</p>
          </div>
        </FeatureSection>

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

        <FeatureSection moduleId="bookings-calendar" featureId="booking-reminders" featureLabel="Automated Reminders">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Send reminder</label>
            <select value={reminderHours} onChange={(e) => setReminderHours(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
              <option value="0">No reminder</option>
              <option value="1">1 hour before</option>
              <option value="2">2 hours before</option>
              <option value="24">24 hours before</option>
              <option value="48">48 hours before</option>
            </select>
          </div>
        </FeatureSection>

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
              {booking ? "Save Changes" : `Create ${vocab.booking}`}
            </Button>
          </div>
        </div>
      </form>
    </SlideOver>
  );
}
