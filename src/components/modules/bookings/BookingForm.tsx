"use client";

import { useState, useEffect, useMemo } from "react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { resolveDuration } from "@/lib/services/price";
import { Booking, BookingStatus } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { TeamMemberPicker } from "@/components/ui/TeamMemberPicker";
import { useModuleEnabled } from "@/hooks/useFeature";
import { useAuth } from "@/hooks/useAuth";

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking;
  defaultDate?: string;
  prefill?: {
    clientId?: string;
    startAt?: string;
    endAt?: string;
    serviceId?: string;
  };
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const emptyForm = {
  clientId: "",
  date: "",
  startAt: "09:00",
  endAt: "10:00",
  status: "pending" as BookingStatus,
  notes: "",
  serviceId: "",
};

export function BookingForm({ open, onClose, booking, defaultDate, prefill }: BookingFormProps) {
  const { addBooking, updateBooking, deleteBooking } = useBookingsStore();
  const { clients } = useClientsStore();
  const { services } = useServicesStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const teamEnabled = useModuleEnabled("team");
  const [form, setForm] = useState(emptyForm);
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  const clientOptions = useMemo(
    () => [
      { value: "", label: "No client" },
      { value: "__new__", label: "+ Create new client" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  );

  const selectedService = useMemo(() => {
    if (!form.serviceId) return undefined;
    return services.find((s) => s.id === form.serviceId);
  }, [services, form.serviceId]);

  // Format startAt/endAt: extract HH:MM from ISO or use as-is if already HH:MM
  const toTimeString = (val: string) => {
    if (val.includes("T")) {
      const d = new Date(val);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return val;
  };

  useEffect(() => {
    if (open) {
      if (booking) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          clientId: booking.clientId ?? "",
          date: booking.date,
          startAt: toTimeString(booking.startAt),
          endAt: toTimeString(booking.endAt),
          status: booking.status,
          notes: booking.notes,
          serviceId: booking.serviceId ?? "",
        });
        setAssignedToId(booking.assignedToId);
      } else {
        setForm({
          ...emptyForm,
          date: defaultDate ?? "",
          ...(prefill && {
            clientId: prefill.clientId ?? "",
            startAt: prefill.startAt ? toTimeString(prefill.startAt) : "09:00",
            endAt: prefill.endAt ? toTimeString(prefill.endAt) : "10:00",
            serviceId: prefill.serviceId ?? "",
          }),
        });
        setAssignedToId(undefined);
      }
      setErrors({});
      setNewClientName("");
      setNewClientEmail("");
    }
  }, [open, booking, defaultDate, prefill]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = "Date is required";
    if (form.clientId === "__new__") {
      if (!newClientName.trim()) errs.newClientName = "Client name is required";
      if (!newClientEmail.trim()) errs.newClientEmail = "Client email is required";
    }
    if (!form.startAt) errs.startAt = "Start time is required";
    if (!form.endAt) errs.endAt = "End time is required";
    if (form.startAt && form.endAt && form.startAt >= form.endAt) {
      errs.endAt = "End time must be after start time";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    let resolvedClientId = form.clientId || undefined;

    if (form.clientId === "__new__") {
      const newClient = useClientsStore.getState().addClient({
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone: "",
        notes: "",
      } as Omit<typeof newClient, "id" | "createdAt" | "updatedAt">, workspaceId ?? undefined);
      resolvedClientId = newClient.id;
    }

    const data = {
      workspaceId: workspaceId || "",
      clientId: resolvedClientId || "",
      serviceId: form.serviceId || undefined,
      assignedToId: assignedToId || undefined,
      date: form.date,
      startAt: form.startAt,
      endAt: form.endAt,
      status: form.status,
      notes: form.notes.trim(),
    };

    if (booking) {
      updateBooking(booking.id, data as Partial<Booking>, workspaceId ?? undefined);
    } else {
      addBooking(data as Omit<Booking, "id" | "createdAt" | "updatedAt">, workspaceId ?? undefined);
    }

    onClose();
    setSaving(false);
  };

  const handleDelete = () => {
    if (booking) {
      deleteBooking(booking.id, workspaceId ?? undefined);
      onClose();
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleServiceChange = (serviceId: string) => {
    set("serviceId", serviceId);
    const svc = services.find((s) => s.id === serviceId);
    if (svc) {
      // Auto-calculate end time from service duration. Honors tier-specific
      // duration when an artist is already assigned (Master tier might be
      // 25% faster than Junior on the same cut).
      const duration = resolveDuration(svc, { memberId: assignedToId ?? null });
      const startMinutes = parseInt(form.startAt.split(":")[0]) * 60 + parseInt(form.startAt.split(":")[1]);
      const endMinutes = startMinutes + duration;
      const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
      const endMins = String(endMinutes % 60).padStart(2, "0");
      setForm((f) => ({
        ...f,
        serviceId,
        endAt: `${endHours}:${endMins}`,
      }));
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={booking ? `Edit ${vocab.booking}` : vocab.addBooking}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service dropdown */}
        {services.length > 0 && (
          <FormField label="Service">
            <select
              value={form.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            >
              <option value="">Select a service (optional)</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — ${svc.price} ({svc.duration}min)
                </option>
              ))}
            </select>
          </FormField>
        )}

        {/* Selected service info */}
        {selectedService && (
          <div className="text-xs text-text-secondary bg-surface rounded-lg px-3 py-2 border border-border-light">
            {selectedService.name} — ${selectedService.price} ({selectedService.duration}min)
          </div>
        )}

        <FormField label={vocab.client}>
          <SelectField
            options={clientOptions}
            value={form.clientId}
            onChange={(e) => set("clientId", e.target.value)}
          />
        </FormField>

        {form.clientId === "__new__" && (
          <div className="space-y-3 pl-3 border-l-2 border-primary/20 animate-in slide-in-from-top-1 fade-in duration-200">
            <FormField label="Client Name" required error={errors.newClientName}>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                placeholder="Full name"
              />
            </FormField>
            <FormField label="Client Email" required error={errors.newClientEmail}>
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                placeholder="email@example.com"
              />
            </FormField>
          </div>
        )}

        {teamEnabled && (
          <TeamMemberPicker
            value={assignedToId}
            onChange={(id, _name) => {
              setAssignedToId(id);
            }}
          />
        )}

        <FormField label="Date" required error={errors.date}>
          <DateField
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            allowPast={false}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Start Time" required error={errors.startAt}>
            <input
              type="time"
              value={form.startAt}
              onChange={(e) => set("startAt", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </FormField>

          <FormField label="End Time" required error={errors.endAt}>
            <input
              type="time"
              value={form.endAt}
              onChange={(e) => set("endAt", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </FormField>
        </div>

        <FormField label="Status">
          <SelectField
            options={statusOptions}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
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
              <Button variant="secondary" size="sm" type="button" onClick={() => setDeleteConfirmOpen(true)}>
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${vocab.booking}`}
        message={`Are you sure you want to delete this booking? This action cannot be undone.`}
      />
    </SlideOver>
  );
}
