"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { Booking, BookingStatus } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import type { ServiceVariant } from "@/types/industry-config";
import { ServicePicker } from "./ServicePicker";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { TravelCalculator } from "@/components/ui/TravelCalculator";
import { SatisfactionPrompt } from "./SatisfactionPrompt";
import { StarRating } from "@/components/ui/StarRating";
import { TeamMemberPicker } from "@/components/ui/TeamMemberPicker";
import { useModuleEnabled } from "@/hooks/useFeature";
import { useAuth } from "@/hooks/useAuth";
import { CustomFieldsSection } from "@/components/modules/shared/CustomFieldsSection";

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking;
  defaultDate?: string;
  prefill?: {
    title?: string;
    clientId?: string;
    startTime?: string;
    endTime?: string;
    serviceId?: string;
    serviceName?: string;
  };
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

export function BookingForm({ open, onClose, booking, defaultDate, prefill }: BookingFormProps) {
  const { addBooking, updateBooking, deleteBooking, hasConflict, cancellationPolicy } = useBookingsStore();
  const { clients } = useClientsStore();
  const { services: storeServices } = useServicesStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const teamEnabled = useModuleEnabled("team");
  const isServiceMenu = config.bookingMode.defaultMode === "service-menu";
  const isRecurringLesson = config.bookingMode.defaultMode === "recurring-lesson";
  const isDateExclusive = config.bookingMode.defaultMode === "date-exclusive";
  const [form, setForm] = useState(emptyForm);
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);
  const [assignedToName, setAssignedToName] = useState<string | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<{ id: string; name: string; duration: number; price: number } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [travelMinutes, setTravelMinutes] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [reminderHours, setReminderHours] = useState("24");
  const [noShow, setNoShow] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState("");
  const [resource, setResource] = useState("");
  const [policyConsent, setPolicyConsent] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clientOptions = useMemo(
    () => [
      { value: "", label: "No client" },
      { value: "__new__", label: "+ Create new client" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  );

  useEffect(() => {
    if (open) {
      if (booking) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        setAssignedToId(booking.assignedToId);
        setAssignedToName(booking.assignedToName);
        setShowAdvanced(!!(booking.status !== "pending" || booking.recurring || booking.notes.trim()));
      } else {
        setForm({
          ...emptyForm,
          date: defaultDate ?? "",
          recurring: isRecurringLesson ? "weekly" : "none",
          ...(prefill && {
            title: prefill.title ?? "",
            clientId: prefill.clientId ?? "",
            startTime: prefill.startTime ?? "09:00",
            endTime: prefill.endTime ?? "10:00",
          }),
        });
        setAssignedToId(undefined);
        setAssignedToName(undefined);
        setShowAdvanced(false);
      }
      setErrors({});
      // Pre-select service from store if editing a booking or prefill has serviceId
      const preSelectId = booking?.serviceId ?? prefill?.serviceId;
      if (preSelectId) {
        const svc = storeServices.find((s) => s.id === preSelectId);
        if (svc) {
          setSelectedService({ id: svc.id, name: booking?.serviceName ?? svc.name, duration: svc.duration, price: booking?.price ?? svc.price });
        } else {
          setSelectedService(booking ? { id: preSelectId, name: booking.serviceName ?? "", duration: booking.duration ?? 0, price: booking.price ?? 0 } : null);
        }
      } else {
        setSelectedService(null);
      }
      setPolicyConsent(!!booking?.cancellationPolicyConsent?.accepted);
      setNewClientName("");
      setNewClientEmail("");
      setCustomData((booking as unknown as Record<string, unknown>)?.customData as Record<string, unknown> ?? {});
    }
  }, [open, booking, defaultDate, prefill]);

  const conflictDetected = useMemo(() => {
    if (!form.date || !form.startTime || !form.endTime) return false;
    return hasConflict(form.date, form.startTime, form.endTime, booking?.id);
  }, [form.date, form.startTime, form.endTime, booking?.id, hasConflict]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.date) errs.date = "Date is required";
    if (form.clientId === "__new__") {
      if (!newClientName.trim()) errs.newClientName = "Client name is required";
      if (!newClientEmail.trim()) errs.newClientEmail = "Client email is required";
    }
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

    let resolvedClientId = form.clientId || undefined;

    if (form.clientId === "__new__") {
      const newClient = useClientsStore.getState().addClient({
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone: "",
        tags: [],
        notes: "",
        status: "active",
      }, workspaceId ?? undefined);
      resolvedClientId = newClient.id;
    }

    const data: Record<string, unknown> = {
      title: form.title.trim(),
      clientId: resolvedClientId,
      date: form.date,
      startTime: isDateExclusive ? "00:00" : form.startTime,
      endTime: isDateExclusive ? "23:59" : form.endTime,
      status: form.status,
      notes: form.notes.trim(),
      recurring: form.recurring === "none" ? undefined : (form.recurring as Booking["recurring"]),
      assignedToId: assignedToId || undefined,
      assignedToName: assignedToName || undefined,
    };

    if (selectedService) {
      data.serviceId = selectedService.id;
      data.serviceName = selectedService.name;
      data.price = selectedService.price;
      data.duration = selectedService.duration;
    }

    if (requireDeposit) {
      data.requireDeposit = true;
      data.depositAmount = parseFloat(depositAmount) || 0;
    }

    if (travelMinutes && parseInt(travelMinutes) > 0) {
      data.travelMinutes = parseInt(travelMinutes);
    }

    if (parseInt(reminderHours) > 0) {
      data.reminderHours = parseInt(reminderHours);
    }

    if (noShow) {
      data.noShow = true;
    }

    if (maxAttendees && parseInt(maxAttendees) > 0) {
      data.maxAttendees = parseInt(maxAttendees);
    }

    if (resource.trim()) {
      data.resource = resource.trim();
    }

    if (policyConsent && cancellationPolicy) {
      data.cancellationPolicyConsent = {
        accepted: true,
        acceptedAt: new Date().toISOString(),
      };
    }

    if (Object.keys(customData).length > 0) {
      data.customData = customData;
    }

    if (booking) {
      updateBooking(booking.id, data as Partial<Booking>, workspaceId ?? undefined);
    } else {
      addBooking(data as unknown as Omit<Booking, "id" | "createdAt" | "updatedAt">, workspaceId ?? undefined);
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
            onSelect={(service, variant?: ServiceVariant) => {
              const duration = variant ? variant.duration : service.duration;
              const price = variant ? variant.price : service.price;
              const label = variant ? `${service.name} (${variant.label})` : service.name;
              const startMinutes = parseInt(form.startTime.split(":")[0]) * 60 + parseInt(form.startTime.split(":")[1]);
              const endMinutes = startMinutes + duration;
              const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
              const endMins = String(endMinutes % 60).padStart(2, "0");
              setForm((f) => ({
                ...f,
                title: label,
                endTime: `${endHours}:${endMins}`,
              }));
              // Store service metadata for the booking record
              setSelectedService({ id: service.id, name: label, duration, price });
            }}
          />
        )}

        {/* Service dropdown from services store */}
        {storeServices.length > 0 && (
          <FormField label="Service">
            <select
              value={selectedService?.id ?? ""}
              onChange={(e) => {
                const svc = storeServices.find((s) => s.id === e.target.value);
                if (svc) {
                  setSelectedService({ id: svc.id, name: svc.name, duration: svc.duration, price: svc.price });
                  const startMinutes = parseInt(form.startTime.split(":")[0]) * 60 + parseInt(form.startTime.split(":")[1]);
                  const endMinutes = startMinutes + svc.duration;
                  const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
                  const endMins = String(endMinutes % 60).padStart(2, "0");
                  setForm((f) => ({
                    ...f,
                    title: f.title || svc.name,
                    endTime: `${endHours}:${endMins}`,
                  }));
                } else {
                  setSelectedService(null);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            >
              <option value="">Select a service (optional)</option>
              {storeServices.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — ${svc.price} ({svc.duration}min)
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
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
            onChange={(id, name) => {
              setAssignedToId(id);
              setAssignedToName(name);
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

        {!isDateExclusive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Time" required error={errors.startTime}>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
            </FormField>

            <FormField label="End Time" required error={errors.endTime}>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
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

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showAdvanced ? "Show fewer options" : "Show more options"}
        </button>

        {showAdvanced && (<>
        <FeatureSection moduleId="bookings-calendar" featureId="booking-deposits" featureLabel="Booking Deposits">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={requireDeposit} onChange={(e) => setRequireDeposit(e.target.checked)} className="rounded" />
              <span className="text-[13px] text-foreground">Require deposit</span>
            </label>
            {requireDeposit && (
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">Deposit Amount ($)</label>
                <input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
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
            <input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="e.g. 10" className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
            <p className="text-[11px] text-text-tertiary mt-1">Leave empty for 1-on-1 appointments.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="resource-room-assignment" featureLabel="Room / Resource">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Room / Resource</label>
            <input type="text" value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g. Room 1, Chair 3" className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="travel-time" featureLabel="Travel Time">
          <div className="bg-surface/50 rounded-xl border border-border-light p-4">
            <h4 className="text-[13px] font-semibold text-foreground mb-3">Travel Time</h4>
            <TravelCalculator
              showCost={false}
              onResult={(result) => {
                setTravelMinutes(String(result.durationRounded));
              }}
            />
            {travelMinutes && parseInt(travelMinutes) > 0 && (
              <div className="mt-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{travelMinutes} min</span> travel time will be blocked before this appointment.
                </p>
              </div>
            )}
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="booking-confirmation-flow" featureLabel="Booking Confirmation">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-800">New bookings will land as &quot;Pending&quot; and need manual confirmation.</p>
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
            <select value={reminderHours} onChange={(e) => setReminderHours(e.target.value)} className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30">
              <option value="0">No reminder</option>
              <option value="1">1 hour before</option>
              <option value="2">2 hours before</option>
              <option value="24">24 hours before</option>
              <option value="48">48 hours before</option>
            </select>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="cancellation-policy" featureLabel="Cancellation Policy">
          {cancellationPolicy ? (
            <div className="space-y-2">
              <div className="p-3 bg-surface rounded-lg border border-border-light">
                <p className="text-xs text-text-secondary whitespace-pre-wrap">{cancellationPolicy}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyConsent}
                  onChange={(e) => setPolicyConsent(e.target.checked)}
                  className="rounded"
                />
                <span className="text-[13px] text-foreground">Client agrees to cancellation policy</span>
              </label>
              {booking?.cancellationPolicyConsent?.accepted && (
                <p className="text-[11px] text-green-600">
                  Accepted on {new Date(booking.cancellationPolicyConsent.acceptedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-tertiary">No cancellation policy set. Add one from the Scheduling page settings.</p>
          )}
        </FeatureSection>

        <FeatureSection moduleId="bookings-calendar" featureId="satisfaction-rating" featureLabel="Post-Service Rating">
          {booking && booking.status === "completed" && !booking.satisfactionRating && (
            <SatisfactionPrompt booking={booking} />
          )}
          {booking && booking.satisfactionRating && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-green-900">Client Rating</span>
                <StarRating value={booking.satisfactionRating} readOnly size="sm" />
              </div>
              {booking.satisfactionFeedback && (
                <p className="text-xs text-green-800">{booking.satisfactionFeedback}</p>
              )}
              {booking.ratedAt && (
                <p className="text-[11px] text-green-600">Rated on {new Date(booking.ratedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </FeatureSection>
        </>)}

        {/* Persona custom fields */}
        {(config.customFields?.bookings ?? []).length > 0 && (
          <div className="border-t border-border-light pt-5 mt-2">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Additional Details</p>
            <CustomFieldsSection
              fields={config.customFields?.bookings ?? []}
              values={customData}
              onChange={setCustomData}
            />
          </div>
        )}

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
        message={`Are you sure you want to delete "${booking?.title}"? This action cannot be undone.`}
      />
    </SlideOver>
  );
}
