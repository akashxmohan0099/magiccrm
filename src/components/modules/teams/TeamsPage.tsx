"use client";

import { useState, useMemo } from "react";
import { UsersRound, Mail, Phone, Calendar, Clock, Trash2, Send, Instagram, Globe, Facebook } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { useClientsStore } from "@/store/clients";
import { TeamMember, TeamRole, WorkingHours, Booking, Service, Client, TeamMemberSocialLinks, LeavePeriod } from "@/types/models";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { Modal } from "@/components/ui/Modal";
import { LogoUpload } from "@/components/ui/LogoUpload";
import { TextArea } from "@/components/ui/TextArea";
import { toast } from "@/components/ui/Toast";
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
  const { members, updateMember } = useTeamStore();
  const { bookings } = useBookingsStore();
  const { services } = useServicesStore();
  const { workspaceId } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const [inviteOpen, setInviteOpen] = useState(false);

  const handleOpenManual = () => {
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenManual}
              className="text-[13px] text-text-secondary hover:text-foreground cursor-pointer"
            >
              Add manually
            </button>
            <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
              <Send className="w-4 h-4 mr-1.5" />
              Invite Team Member
            </Button>
          </div>
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
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    )}
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

      {/* Manual add / Edit slide-over */}
      <TeamMemberForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        member={editing ?? undefined}
        onSave={(data) => {
          if (editing) {
            updateMember(editing.id, data, workspaceId || undefined);
            setFormOpen(false);
            setEditingId(null);
            return;
          }

          // Manual add: create auth user + workspace_members row via invite API.
          // The invitee gets an email link to set their password.
          (async () => {
            try {
              const res = await fetch("/api/auth/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: data.email,
                  name: data.name,
                  role: data.role,
                  workspaceId,
                  phone: data.phone,
                  workingHours: data.workingHours,
                  daysOff: data.daysOff,
                  avatarUrl: data.avatarUrl,
                  bio: data.bio,
                  socialLinks: data.socialLinks,
                }),
              });
              const json = await res.json();
              if (!res.ok || !json.success) {
                toast(json.error || "Failed to add team member");
                return;
              }
              toast(`${data.name} added · sign-in link sent to ${data.email}`);
              if (workspaceId) {
                await useTeamStore.getState().loadFromSupabase(workspaceId);
              }
              setFormOpen(false);
              setEditingId(null);
            } catch (err) {
              console.error(err);
              toast("Failed to add team member");
            }
          })();
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

      {/* Invite modal */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}

// ── Invite Modal ──

function InviteMemberModal({
  open,
  onClose,
  workspaceId,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [submitting, setSubmitting] = useState(false);

  // Reset on open
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName("");
      setEmail("");
      setRole("staff");
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email.trim()) && !submitting;

  const handleSend = async () => {
    if (!canSubmit || !workspaceId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
          workspaceId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast(json.error || "Failed to send invite");
        setSubmitting(false);
        return;
      }
      toast(`Invite sent to ${email.trim()}`);
      await useTeamStore.getState().loadFromSupabase(workspaceId);
      onClose();
    } catch (err) {
      console.error(err);
      toast("Failed to send invite");
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite team member">
      <div className="space-y-4">
        <p className="text-[13px] text-text-secondary">
          We&apos;ll email them a sign-in link. They&apos;ll add their photo, bio, working hours, and socials themselves.
        </p>

        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoFocus
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleSend(); }}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Role</p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="flex-1" onClick={handleSend} disabled={!canSubmit}>
            <Send className="w-4 h-4 mr-1.5" />
            {submitting ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Team Member Manual Add / Edit Form ──

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
    leavePeriods: LeavePeriod[];
    avatarUrl?: string;
    bio?: string;
    socialLinks?: TeamMemberSocialLinks;
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
  const [leavePeriods, setLeavePeriods] = useState<LeavePeriod[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");

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
      setLeavePeriods([...(member.leavePeriods ?? [])]);
      setAvatarUrl(member.avatarUrl ?? "");
      setBio(member.bio ?? "");
      setInstagram(member.socialLinks?.instagram ?? "");
      setTiktok(member.socialLinks?.tiktok ?? "");
      setFacebook(member.socialLinks?.facebook ?? "");
      setWebsite(member.socialLinks?.website ?? "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setRole("staff");
      setWorkingHours({ ...DEFAULT_WORKING_HOURS });
      setDaysOff(["sat", "sun"]);
      setLeavePeriods([]);
      setAvatarUrl("");
      setBio("");
      setInstagram("");
      setTiktok("");
      setFacebook("");
      setWebsite("");
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
    const trimmedSocials: TeamMemberSocialLinks = {};
    if (instagram.trim()) trimmedSocials.instagram = instagram.trim();
    if (tiktok.trim()) trimmedSocials.tiktok = tiktok.trim();
    if (facebook.trim()) trimmedSocials.facebook = facebook.trim();
    if (website.trim()) trimmedSocials.website = website.trim();
    const hasSocials = Object.keys(trimmedSocials).length > 0;

    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      workingHours: filteredHours,
      daysOff,
      leavePeriods,
      avatarUrl: avatarUrl || undefined,
      bio: bio.trim() || undefined,
      socialLinks: hasSocials ? trimmedSocials : undefined,
    });
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
        {/* Header — full identity card when editing, simple title when adding */}
        {member ? (
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {(avatarUrl || member.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl || member.avatarUrl || ""} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[14px] font-bold text-primary">{member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                <p className="text-[12px] text-text-secondary capitalize">{member.role}{member.email ? ` · ${member.email}` : ""}</p>
              </div>
            </div>
            {onDelete && (
              <button onClick={() => setDeleteOpen(true)} className="p-2 text-text-tertiary hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        ) : (
          <div className="mb-5">
            <h3 className="text-xl font-bold text-foreground">Add team member</h3>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Set up their full profile. They&apos;ll get a sign-in link to set a password and can edit anything later.
            </p>
          </div>
        )}

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

        {/* Leave / time off */}
        <div className="pt-5 border-t border-border-light">
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
            Leave / time off
          </p>
          <p className="text-[12px] text-text-secondary mb-3">
            Date ranges this artist isn&apos;t available — vacation, family, sick leave. The booking flow won&apos;t offer slots in these windows.
          </p>
          <div className="space-y-2">
            {leavePeriods.map((lp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-surface border border-border-light rounded-lg px-3 py-2"
              >
                <input
                  type="date"
                  value={lp.start}
                  onChange={(e) =>
                    setLeavePeriods((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, start: e.target.value } : p)),
                    )
                  }
                  className="px-2 py-1 bg-card-bg border border-border-light rounded text-[12px] text-foreground outline-none"
                />
                <span className="text-[12px] text-text-tertiary">to</span>
                <input
                  type="date"
                  value={lp.end}
                  onChange={(e) =>
                    setLeavePeriods((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, end: e.target.value } : p)),
                    )
                  }
                  className="px-2 py-1 bg-card-bg border border-border-light rounded text-[12px] text-foreground outline-none"
                />
                <input
                  type="text"
                  value={lp.reason ?? ""}
                  onChange={(e) =>
                    setLeavePeriods((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, reason: e.target.value } : p)),
                    )
                  }
                  placeholder="Reason (optional)"
                  className="flex-1 px-2 py-1 bg-card-bg border border-border-light rounded text-[12px] text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLeavePeriods((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="p-1 text-text-tertiary hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setLeavePeriods((prev) => [...prev, { start: today, end: today }]);
              }}
              className="text-[12px] text-primary hover:underline cursor-pointer"
            >
              + Add leave period
            </button>
          </div>
        </div>

        {/* Profile (photo, bio, socials) */}
        <div className="pt-5 border-t border-border-light space-y-5">
            <div>
              <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Profile</p>
              <p className="text-[12px] text-text-secondary mt-0.5">Shown to clients on the booking page. All optional.</p>
            </div>

            <LogoUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              label="Photo"
              emptyLabel="No photo"
              setLabel="Photo set"
              allowUrlPaste={false}
              hint="Square headshot works best."
            />

            <div>
              <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Bio</p>
              <TextArea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short intro — specialties, years of experience, anything that helps clients pick them."
                rows={3}
                className="!text-[13px] !py-2.5"
              />
            </div>

            <div>
              <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Social Links</p>
              <div className="space-y-2">
                <SocialInput
                  icon={<Instagram className="w-4 h-4" />}
                  value={instagram}
                  onChange={setInstagram}
                  placeholder="instagram.com/handle"
                />
                <SocialInput
                  icon={<TikTokIcon className="w-4 h-4" />}
                  value={tiktok}
                  onChange={setTiktok}
                  placeholder="tiktok.com/@handle"
                />
                <SocialInput
                  icon={<Facebook className="w-4 h-4" />}
                  value={facebook}
                  onChange={setFacebook}
                  placeholder="facebook.com/handle"
                />
                <SocialInput
                  icon={<Globe className="w-4 h-4" />}
                  value={website}
                  onChange={setWebsite}
                  placeholder="yourwebsite.com"
                />
              </div>
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

// ── Helpers ──

function SocialInput({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface border border-border-light rounded-lg px-3 focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-text-tertiary flex-shrink-0">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 py-2 bg-transparent text-[13px] text-foreground outline-none placeholder:text-text-tertiary"
      />
    </div>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.896 2.896 0 0 1 2.305-4.638 2.91 2.91 0 0 1 .89.135V9.4a6.354 6.354 0 0 0-1-.083 6.34 6.34 0 0 0-3.486 11.643 6.337 6.337 0 0 0 9.823-5.291V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.83 4.83 0 0 1-.889-.104z" />
    </svg>
  );
}
