"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { useLocationsStore } from "@/store/locations";
import { useTeamStore } from "@/store/team";
import { useResourcesStore } from "@/store/resources";
import { resolveDuration } from "@/lib/services/price";
import {
  findResourceConflicts,
  type ConflictBooking,
} from "@/lib/services/resource-conflicts";
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
  /**
   * Ordered list of services stacked into one appointment. Index 0 is the
   * primary service (used for display/intake/pricing snapshots); indices
   * 1+ are persisted as `additionalServiceIds`. An empty array means
   * "no service picked yet".
   */
  serviceIds: [] as string[],
  locationId: "",
  address: "",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDuration(mins: number): string {
  if (mins <= 0) return "0min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function BookingForm({ open, onClose, booking, defaultDate, prefill }: BookingFormProps) {
  const { addBooking, updateBooking, deleteBooking, bookings } = useBookingsStore();
  const { clients } = useClientsStore();
  const { services } = useServicesStore();
  const { locations } = useLocationsStore();
  const { members } = useTeamStore();
  const { resources } = useResourcesStore();
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
  // Resource-conflict override: when the candidate booking would clash with
  // another booking that holds one of its required resources, we surface a
  // soft warning. The operator can still save by ticking the override and
  // entering a short reason — the reason gets prepended to the booking's
  // notes for audit.
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const clientOptions = useMemo(
    () => [
      { value: "", label: "No client" },
      { value: "__new__", label: "+ Create new client" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients]
  );

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s] as const)),
    [services],
  );

  const selectedServices = useMemo(
    () =>
      form.serviceIds
        .map((id) => serviceById.get(id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [form.serviceIds, serviceById],
  );

  /** Primary service: the first picked. Drives intake + display + resource conflicts. */
  const selectedService = selectedServices[0];

  // When a location is picked and the workspace has 2+ locations, hide
  // services that aren't offered at that location (matches the public
  // booking flow). Services already in the basket stay visible even if
  // they don't match — the mismatched name flags it for review.
  const visibleServices = useMemo(() => {
    if (!form.locationId || locations.length < 2) return services;
    const picked = new Set(form.serviceIds);
    return services.filter((s) => {
      if (picked.has(s.id)) return true;
      if (!s.locationIds || s.locationIds.length === 0) return true;
      return s.locationIds.includes(form.locationId);
    });
  }, [services, form.locationId, form.serviceIds, locations.length]);

  /** Total duration across every selected service, honoring per-tier overrides. */
  const totalDurationMin = useMemo(
    () =>
      selectedServices.reduce(
        (sum, svc) => sum + resolveDuration(svc, { memberId: assignedToId ?? null }),
        0,
      ),
    [selectedServices, assignedToId],
  );

  // Build the candidate window in ISO so the conflict checker can compare it
  // against in-memory bookings on the same date.
  const candidate = useMemo(() => {
    if (!form.date || !form.startAt || !form.endAt || !selectedService) return null;
    const reqs = selectedService.requiredResourceIds ?? [];
    if (reqs.length === 0) return null;
    return {
      startAt: `${form.date}T${form.startAt}:00`,
      endAt: `${form.date}T${form.endAt}:00`,
      requiredResourceIds: reqs,
    };
  }, [form.date, form.startAt, form.endAt, selectedService]);

  const sameDayBookings = useMemo<ConflictBooking[]>(() => {
    if (!form.date) return [];
    const memberById = new Map(members.map((m) => [m.id, m.name] as const));
    const serviceById = new Map(services.map((s) => [s.id, s] as const));
    const out: ConflictBooking[] = [];
    for (const b of bookings) {
      if (b.date !== form.date) continue;
      if (booking && b.id === booking.id) continue;
      const svc = b.serviceId ? serviceById.get(b.serviceId) : undefined;
      const reqs = svc?.requiredResourceIds ?? [];
      if (reqs.length === 0) continue;
      out.push({
        id: b.id,
        startAt: b.startAt.includes("T") ? b.startAt : `${b.date}T${b.startAt}:00`,
        endAt: b.endAt.includes("T") ? b.endAt : `${b.date}T${b.endAt}:00`,
        requiredResourceIds: reqs,
        bufferBefore: svc?.bufferBefore,
        bufferAfter: svc?.bufferAfter ?? svc?.bufferMinutes,
        serviceName: svc?.name,
        assignedMemberName: b.assignedToId ? memberById.get(b.assignedToId) : undefined,
      });
    }
    return out;
  }, [bookings, services, members, form.date, booking]);

  const conflicts = useMemo(() => {
    if (!candidate) return [];
    return findResourceConflicts(candidate, sameDayBookings);
  }, [candidate, sameDayBookings]);

  const resourceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of resources) map.set(r.id, r.name);
    return map;
  }, [resources]);

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
        const ids = [
          ...(booking.serviceId ? [booking.serviceId] : []),
          ...(booking.additionalServiceIds ?? []),
        ];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          clientId: booking.clientId ?? "",
          date: booking.date,
          startAt: toTimeString(booking.startAt),
          endAt: toTimeString(booking.endAt),
          status: booking.status,
          notes: booking.notes,
          serviceIds: ids,
          locationId: booking.locationId ?? "",
          address: booking.address ?? "",
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
            serviceIds: prefill.serviceId ? [prefill.serviceId] : [],
          }),
        });
        setAssignedToId(undefined);
      }
      setErrors({});
      setNewClientName("");
      setNewClientEmail("");
      setOverrideConflict(false);
      setOverrideReason("");
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

    // Resource-conflict gate: when the candidate window clashes with an
    // existing booking that holds one of the same required resources, the
    // operator must explicitly opt in via override + reason. Without this
    // we'd silently let staff double-book a room/chair.
    if (conflicts.length > 0) {
      if (!overrideConflict) {
        setErrors((prev) => ({
          ...prev,
          conflict: "Please acknowledge the resource conflict to continue.",
        }));
        return;
      }
      if (!overrideReason.trim()) {
        setErrors((prev) => ({ ...prev, conflict: "A short reason is required." }));
        return;
      }
    }

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

    const selectedLoc = locations.find((l) => l.id === form.locationId) ?? null;
    // Audit trail for resource-conflict overrides — once we have a dedicated
    // audit field this can move there. For now the override reason is
    // prepended to notes so it's visible on the booking detail.
    const baseNotes = form.notes.trim();
    const persistedNotes =
      conflicts.length > 0 && overrideConflict && overrideReason.trim()
        ? `Override: ${overrideReason.trim()}${baseNotes ? `\n\n${baseNotes}` : ""}`
        : baseNotes;
    const [primaryServiceId, ...extraServiceIds] = form.serviceIds;
    const data = {
      workspaceId: workspaceId || "",
      clientId: resolvedClientId || "",
      serviceId: primaryServiceId || undefined,
      additionalServiceIds: extraServiceIds.length ? extraServiceIds : undefined,
      assignedToId: assignedToId || undefined,
      date: form.date,
      startAt: form.startAt,
      endAt: form.endAt,
      status: form.status,
      notes: persistedNotes,
      locationId: form.locationId || undefined,
      locationType: selectedLoc?.kind,
      address: selectedLoc?.kind === "mobile" ? form.address.trim() || undefined : undefined,
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

  /**
   * Recompute endAt from the given service list + start time. Sums durations
   * across every selected service, honoring tier-specific durations for the
   * currently assigned member. Called whenever the basket or start time
   * changes — never from a useEffect, so the user can still hand-edit the
   * end time without it snapping back.
   */
  const computeEndFromServices = (ids: string[], startAt: string): string | null => {
    const total = ids.reduce((sum, id) => {
      const svc = serviceById.get(id);
      if (!svc) return sum;
      return sum + resolveDuration(svc, { memberId: assignedToId ?? null });
    }, 0);
    if (total <= 0) return null;
    return minutesToTime(timeToMinutes(startAt) + total);
  };

  const updateServicesAt = (idx: number, serviceId: string) => {
    setForm((f) => {
      const next = [...f.serviceIds];
      if (serviceId) next[idx] = serviceId;
      else next.splice(idx, 1);
      const recomputed = computeEndFromServices(next, f.startAt);
      return { ...f, serviceIds: next, endAt: recomputed ?? f.endAt };
    });
  };

  const addServiceSlot = () => {
    setForm((f) => ({ ...f, serviceIds: [...f.serviceIds, ""] }));
  };

  const removeServiceAt = (idx: number) => {
    setForm((f) => {
      const next = f.serviceIds.filter((_, i) => i !== idx);
      const recomputed = computeEndFromServices(next, f.startAt);
      return { ...f, serviceIds: next, endAt: recomputed ?? f.endAt };
    });
  };

  const handleStartAtChange = (startAt: string) => {
    setForm((f) => {
      const recomputed = computeEndFromServices(f.serviceIds, startAt);
      return { ...f, startAt, endAt: recomputed ?? f.endAt };
    });
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={booking ? `Edit ${vocab.booking}` : vocab.addBooking}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Services — one or more stacked into the same appointment */}
        {services.length > 0 && (
          <FormField label={form.serviceIds.length > 1 ? "Services" : "Service"}>
            <div className="space-y-2">
              {(form.serviceIds.length === 0 ? [""] : form.serviceIds).map((id, idx) => {
                const isExtraEmptyRow = form.serviceIds.length === 0;
                return (
                  <div key={`${idx}-${id}`} className="flex items-center gap-2">
                    <select
                      value={id}
                      onChange={(e) => {
                        if (isExtraEmptyRow) {
                          if (e.target.value) {
                            setForm((f) => {
                              const next = [e.target.value];
                              const recomputed = computeEndFromServices(next, f.startAt);
                              return { ...f, serviceIds: next, endAt: recomputed ?? f.endAt };
                            });
                          }
                        } else {
                          updateServicesAt(idx, e.target.value);
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    >
                      <option value="">
                        {idx === 0 ? "Select a service (optional)" : "Select a service"}
                      </option>
                      {visibleServices.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} — ${svc.price} ({svc.duration}min)
                        </option>
                      ))}
                    </select>
                    {!isExtraEmptyRow && form.serviceIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceAt(idx)}
                        aria-label="Remove service"
                        className="p-2 text-text-tertiary hover:text-foreground hover:bg-surface rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {selectedServices.length > 0 && (
                <button
                  type="button"
                  onClick={addServiceSlot}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another service
                </button>
              )}
            </div>
          </FormField>
        )}

        {/* Stacked summary — one row per picked service, mirrors the
            booking detail so the operator can verify the basket at a glance. */}
        {selectedServices.length > 0 && (
          <div className="rounded-lg bg-surface border border-border-light divide-y divide-border-light">
            {selectedServices.map((svc) => (
              <div
                key={svc.id}
                className="flex items-center justify-between px-3 py-2 text-xs text-text-secondary"
              >
                <span className="truncate">{svc.name}</span>
                <span className="text-text-tertiary tabular-nums">
                  ${svc.price} · {resolveDuration(svc, { memberId: assignedToId ?? null })}min
                </span>
              </div>
            ))}
            {selectedServices.length > 1 && (
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">
                  ${selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0)} ·{" "}
                  {formatDuration(totalDurationMin)}
                </span>
              </div>
            )}
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

        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Time" required error={errors.startAt}>
              <input
                type="time"
                value={form.startAt}
                onChange={(e) => handleStartAtChange(e.target.value)}
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
          {(() => {
            const actualMin = Math.max(0, timeToMinutes(form.endAt) - timeToMinutes(form.startAt));
            if (actualMin <= 0) return null;
            const matchesServices =
              totalDurationMin > 0 && actualMin === totalDurationMin;
            return (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface border border-border-light text-text-secondary tabular-nums">
                  {formatDuration(actualMin)}
                </span>
                {totalDurationMin > 0 && !matchesServices && (
                  <span className="text-amber-700">
                    (services total {formatDuration(totalDurationMin)})
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        <FormField label="Status">
          <SelectField
            options={statusOptions}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          />
        </FormField>

        {locations.length >= 2 && (
          <FormField label="Location">
            <SelectField
              options={[
                { value: "", label: "No location" },
                ...locations.map((l) => ({
                  value: l.id,
                  label: l.kind === "mobile" ? `${l.name} (mobile)` : l.name,
                })),
              ]}
              value={form.locationId}
              onChange={(e) => set("locationId", e.target.value)}
            />
          </FormField>
        )}

        {(() => {
          const loc = locations.find((l) => l.id === form.locationId);
          if (loc?.kind !== "mobile") return null;
          return (
            <FormField label="Service Address">
              <input
                type="text"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Where the appointment takes place"
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
            </FormField>
          );
        })()}

        {conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 space-y-2">
            <p className="text-[13px] font-semibold text-amber-900">
              Resource conflict
            </p>
            <ul className="text-[12px] text-amber-800 space-y-1 list-disc pl-4">
              {conflicts.map((c, i) => {
                const resName = resourceNameById.get(c.resourceId) ?? c.resourceId;
                const fmtTime = (iso: string) => {
                  const d = new Date(iso);
                  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                };
                const window = `${fmtTime(c.busyStartAt)}–${fmtTime(c.busyEndAt)}`;
                const who = c.assignedMemberName ? ` (${c.assignedMemberName})` : "";
                const what = c.serviceName ? ` for ${c.serviceName}` : "";
                return (
                  <li key={`${c.resourceId}-${c.bookingId}-${i}`}>
                    <strong>{resName}</strong> is already in use {window}
                    {what}
                    {who}.
                  </li>
                );
              })}
            </ul>
            <label className="flex items-center gap-2 text-[12px] text-amber-900 pt-1">
              <input
                type="checkbox"
                checked={overrideConflict}
                onChange={(e) => {
                  setOverrideConflict(e.target.checked);
                  if (!e.target.checked) setOverrideReason("");
                  setErrors((prev) => {
                    const { conflict: _omit, ...rest } = prev;
                    void _omit;
                    return rest;
                  });
                }}
                className="rounded"
              />
              Override and book anyway
            </label>
            {overrideConflict && (
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value);
                  setErrors((prev) => {
                    const { conflict: _omit, ...rest } = prev;
                    void _omit;
                    return rest;
                  });
                }}
                placeholder="Reason (e.g. client approved sharing the room)"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-[13px] text-amber-900 placeholder:text-amber-700/60 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
              />
            )}
            {errors.conflict && (
              <p className="text-[12px] text-red-700">{errors.conflict}</p>
            )}
            <p className="text-[11px] text-amber-700/80">
              The reason is saved with the booking notes for audit.
            </p>
          </div>
        )}

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
