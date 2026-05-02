"use client";

import { useState, useMemo } from "react";
import { UsersRound, Mail, Phone, Calendar, Send } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { useClientsStore } from "@/store/clients";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { TeamMemberForm } from "./TeamMemberForm";
import { InviteMemberModal } from "./InviteMemberModal";
import { DAY_ORDER } from "./constants";

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



