"use client";

import { useState, useMemo } from "react";
import { UsersRound, Plus, Mail, Phone, Calendar, Clock, DollarSign, Trash2 } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { useBookingsStore } from "@/store/bookings";
import { usePaymentsStore } from "@/store/payments";
import { useServicesStore } from "@/store/services";
import { useClientsStore } from "@/store/clients";
import { TeamMember, TeamRole, WorkingHours, Booking, Service, Client } from "@/types/models";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { useAuth } from "@/hooks/useAuth";

const DAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULT_WORKING_HOURS: Record<string, WorkingHours> = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
};

export function TeamsPage() {
  const { members, addMember, updateMember } = useTeamStore();
  const { bookings } = useBookingsStore();
  const { documents } = usePaymentsStore();
  const { services } = useServicesStore();
  const { workspaceId, user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = selectedId ? members.find((m) => m.id === selectedId) : null;
  const editing = editingId ? members.find((m) => m.id === editingId) : null;

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  // Earnings per member (from completed bookings with paid payment docs)
  const memberEarnings = useMemo(() => {
    const earnings: Record<string, number> = {};
    for (const b of bookings) {
      if (b.assignedToId && (b.status === "completed" || b.status === "confirmed")) {
        const service = b.serviceId ? serviceMap.get(b.serviceId) : null;
        if (service) {
          earnings[b.assignedToId] = (earnings[b.assignedToId] || 0) + service.price;
        }
      }
    }
    return earnings;
  }, [bookings, serviceMap]);

  // Booking count per member
  const memberBookingCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bookings) {
      if (b.assignedToId) {
        counts[b.assignedToId] = (counts[b.assignedToId] || 0) + 1;
      }
    }
    return counts;
  }, [bookings]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (memberId: string) => {
    setEditingId(memberId);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Manage team members, availability, and earnings."
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Team Member
          </Button>
        }
      />

      {members.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <UsersRound className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-tertiary text-sm">No team members yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const bookingCount = memberBookingCount[member.id] || 0;
            const earnings = memberEarnings[member.id] || 0;
            const workingDays = Object.keys(member.workingHours).length;

            return (
              <button
                key={member.id}
                onClick={() => handleOpenEdit(member.id)}
                className="bg-card-bg border border-border-light rounded-2xl p-5 text-left hover:shadow-md hover:border-foreground/10 transition-all cursor-pointer"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-foreground">{member.name}</p>
                    <p className="text-[11px] text-text-tertiary capitalize">
                      {member.role}{member.status !== "active" && ` · ${member.status}`}
                    </p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${member.status === "active" ? "bg-emerald-500" : member.status === "invited" ? "bg-amber-500" : "bg-gray-400"}`} />
                </div>

                {/* Contact */}
                <div className="space-y-1 mb-3">
                  <p className="text-[12px] text-text-secondary flex items-center gap-1.5"><Mail className="w-3 h-3" /> {member.email}</p>
                  {member.phone && <p className="text-[12px] text-text-secondary flex items-center gap-1.5"><Phone className="w-3 h-3" /> {member.phone}</p>}
                </div>

                {/* Schedule summary */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {DAY_ORDER.map((day) => {
                    const isWorking = !member.daysOff.includes(day) && member.workingHours[day];
                    return (
                      <span key={day} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isWorking ? "bg-primary/10 text-primary" : "bg-surface text-text-tertiary"}`}>
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </span>
                    );
                  })}
                </div>

                {/* Leave notice */}
                {member.leavePeriods.length > 0 && (() => {
                  const upcoming = member.leavePeriods.find((lp) => new Date(lp.end) >= new Date());
                  if (!upcoming) return null;
                  return (
                    <div className="flex items-center gap-1.5 mb-3 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
                      <Calendar className="w-3 h-3" />
                      Leave: {upcoming.start} – {upcoming.end}
                    </div>
                  );
                })()}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface rounded-lg px-2.5 py-2 text-center">
                    <p className="text-[10px] text-text-tertiary font-medium">Bookings</p>
                    <p className="text-[14px] font-bold text-foreground">{bookingCount}</p>
                  </div>
                  <div className="bg-surface rounded-lg px-2.5 py-2 text-center">
                    <p className="text-[10px] text-text-tertiary font-medium">Earnings</p>
                    <p className="text-[14px] font-bold text-foreground">${earnings.toLocaleString()}</p>
                  </div>
                  <div className="bg-surface rounded-lg px-2.5 py-2 text-center">
                    <p className="text-[10px] text-text-tertiary font-medium">Days/wk</p>
                    <p className="text-[14px] font-bold text-foreground">{workingDays}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add / Edit Team Member */}
      <TeamMemberForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        member={editing ?? undefined}
        onSave={(data) => {
          if (editing) {
            updateMember(editing.id, data, workspaceId || undefined);
          } else {
            addMember({
              authUserId: user?.id ?? "",
              workspaceId: workspaceId ?? "",
              status: "active",
              leavePeriods: [],
              ...data,
            }, workspaceId || undefined);
          }
          setFormOpen(false);
          setEditingId(null);
        }}
        onDelete={editing ? () => {
          if (editing) {
            useTeamStore.getState().deleteMember(editing.id, workspaceId || undefined);
            setFormOpen(false);
            setEditingId(null);
          }
        } : undefined}
        earnings={editing ? memberEarnings[editing.id] || 0 : undefined}
        memberBookings={editing ? bookings.filter((b) => b.assignedToId === editing.id) : []}
        serviceMap={serviceMap}
        clientMap={new Map(useClientsStore.getState().clients.map((c) => [c.id, c]))}
      />
    </div>
  );
}

// ── Team Member Add/Edit Form ──

function TeamMemberForm({
  open, onClose, member, onSave, onDelete, earnings, memberBookings, serviceMap, clientMap,
}: {
  open: boolean;
  onClose: () => void;
  member?: TeamMember;
  onSave: (data: {
    name: string;
    email: string;
    phone?: string;
    role: TeamRole;
    workingHours: Record<string, WorkingHours>;
    daysOff: string[];
  }) => void;
  onDelete?: () => void;
  earnings?: number;
  memberBookings: Booking[];
  serviceMap: Map<string, Service>;
  clientMap: Map<string, Client>;
}) {
  const [tab, setTab] = useState<"details" | "bookings" | "earnings">("details");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [workingHours, setWorkingHours] = useState<Record<string, { start: string; end: string }>>(DEFAULT_WORKING_HOURS);
  const [daysOff, setDaysOff] = useState<string[]>(["sat", "sun"]);

  // Reset form when member changes or panel opens
  const memberKey = member?.id ?? "__new__";
  const [lastKey, setLastKey] = useState(memberKey);
  if (open && memberKey !== lastKey) {
    setLastKey(memberKey);
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setPhone(member.phone ?? "");
      setRole(member.role);
      setWorkingHours(
        Object.keys(member.workingHours).length > 0
          ? { ...member.workingHours }
          : { ...DEFAULT_WORKING_HOURS }
      );
      setDaysOff([...member.daysOff]);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setRole("staff");
      setWorkingHours({ ...DEFAULT_WORKING_HOURS });
      setDaysOff(["sat", "sun"]);
    }
  }

  const toggleDayOff = (day: string) => {
    setDaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const updateHour = (day: string, field: "start" | "end", value: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || { start: "09:00", end: "17:00" }), [field]: value },
    }));
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    // Build working hours excluding days off
    const filteredHours: Record<string, WorkingHours> = {};
    for (const day of DAY_ORDER) {
      if (!daysOff.includes(day) && workingHours[day]) {
        filteredHours[day] = workingHours[day];
      }
    }
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role, workingHours: filteredHours, daysOff });
  };

  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = useMemo(() => memberBookings.filter((b) => b.date >= today && b.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10), [memberBookings, today]);
  const pastBookings = useMemo(() => memberBookings.filter((b) => b.date < today || b.status === "completed").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10), [memberBookings, today]);
  const earningsBreakdown = useMemo(() => memberBookings.filter((b) => b.status === "completed" || b.status === "confirmed").map((b) => {
    const svc = b.serviceId ? serviceMap.get(b.serviceId) : null;
    const client = clientMap.get(b.clientId);
    return { date: b.date, service: svc?.name || "Service", client: client?.name || "Client", amount: svc?.price || 0 };
  }), [memberBookings, serviceMap, clientMap]);

  return (
    <>
    <SlideOver open={open} onClose={onClose} title="">
      <div className="-mt-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[14px] font-bold text-primary">{(member?.name || name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{member?.name || "New Team Member"}</h3>
              <p className="text-[12px] text-text-secondary capitalize">{member?.role || "staff"}{member?.email ? ` · ${member.email}` : ""}</p>
            </div>
          </div>
          {member && onDelete && (
            <button onClick={() => setDeleteOpen(true)} className="p-2 text-text-tertiary hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>

        {/* Tabs (only when editing) */}
        {member && (
          <div className="flex gap-0.5 border-b border-border-light mb-4 -mx-1">
            {(["details", "bookings", "earnings"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer relative capitalize ${tab === t ? "text-foreground" : "text-text-tertiary hover:text-foreground"}`}>
                {t === "details" ? "Details & Schedule" : t === "bookings" ? `Bookings (${memberBookings.length})` : "Earnings"}
                {tab === t && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
              </button>
            ))}
          </div>
        )}

        {/* Details tab (also shown for new members) */}
        {(tab === "details" || !member) && (
      <div className="space-y-5">
        {/* Name */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Name *</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Email */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Email *</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Phone */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Phone</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Role */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Role</p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {/* Days Off */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Days Off</p>
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDayOff(day)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                  daysOff.includes(day)
                    ? "bg-foreground text-background"
                    : "bg-surface text-text-secondary hover:text-foreground border border-border-light"
                }`}
              >
                {DAY_LABELS[day].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 inline mr-1" />Working Hours
          </p>
          <div className="space-y-2">
            {DAY_ORDER.map((day) => {
              const isOff = daysOff.includes(day);
              const hours = workingHours[day] || { start: "09:00", end: "17:00" };
              return (
                <div key={day} className="flex items-center gap-2">
                  <p className="text-[12px] font-medium text-foreground w-16">{DAY_LABELS[day].slice(0, 3)}</p>
                  {isOff ? (
                    <p className="text-[12px] text-text-tertiary">Day off</p>
                  ) : (
                    <>
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateHour(day, "start", e.target.value)}
                        className="px-2 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground outline-none"
                      />
                      <span className="text-[12px] text-text-tertiary">to</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateHour(day, "end", e.target.value)}
                        className="px-2 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground outline-none"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <Button variant="primary" size="sm" className="w-full" onClick={handleSubmit}>
          {member ? "Save Changes" : "Add Team Member"}
        </Button>
      </div>
        )}

        {/* Bookings tab */}
        {tab === "bookings" && member && (
          <div className="space-y-4">
            {upcomingBookings.length > 0 && (
              <div>
                <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Upcoming</h4>
                <div className="space-y-2">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="bg-surface rounded-lg p-3 border border-border-light flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{clientMap.get(b.clientId)?.name || "Client"}</p>
                        <p className="text-[11px] text-text-secondary">{serviceMap.get(b.serviceId || "")?.name || "Service"} · {new Date(b.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pastBookings.length > 0 && (
              <div>
                <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Recent</h4>
                <div className="space-y-2">
                  {pastBookings.map((b) => (
                    <div key={b.id} className="bg-surface rounded-lg p-3 border border-border-light flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{clientMap.get(b.clientId)?.name || "Client"}</p>
                        <p className="text-[11px] text-text-secondary">{serviceMap.get(b.serviceId || "")?.name || "Service"} · {new Date(b.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {memberBookings.length === 0 && (
              <p className="text-[13px] text-text-tertiary text-center py-8">No bookings assigned.</p>
            )}
          </div>
        )}

        {/* Earnings tab */}
        {tab === "earnings" && member && (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-xl p-5 text-center">
              <p className="text-[32px] font-bold text-emerald-600">${(earnings || 0).toLocaleString()}</p>
              <p className="text-[12px] text-emerald-700 mt-1">Total Earnings</p>
            </div>
            {earningsBreakdown.length > 0 && (
              <div>
                <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Breakdown</h4>
                <div className="bg-surface rounded-lg border border-border-light overflow-hidden divide-y divide-border-light">
                  {earningsBreakdown.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-[13px] text-foreground">{e.service}</p>
                        <p className="text-[11px] text-text-tertiary">{e.client} · {new Date(e.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                      </div>
                      <p className="text-[13px] font-semibold text-foreground">${e.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SlideOver>

    {/* Delete confirmation */}
    {onDelete && (
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { onDelete(); setDeleteOpen(false); }}
        title="Remove Team Member"
        message={`Remove ${member?.name || "this team member"}? Their bookings will become unassigned.`}
      />
    )}
    </>
  );
}
