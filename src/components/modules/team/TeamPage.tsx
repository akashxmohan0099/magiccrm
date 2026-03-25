"use client";

import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { useActivityStore } from "@/store/activity";
import { useBookingsStore } from "@/store/bookings";
import { useJobsStore } from "@/store/jobs";
import { useAuth } from "@/hooks/useAuth";
import { TeamMember } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { TeamMemberForm } from "./TeamMemberForm";
import { MemberAvailabilityPanel } from "./MemberAvailabilityPanel";
import { ShiftScheduler } from "./ShiftScheduler";

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", staff: "Staff" };
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-50 text-purple-700",
  admin: "bg-blue-50 text-blue-700",
  staff: "bg-surface text-text-secondary",
};

export function TeamPage() {
  const { members } = useTeamStore();
  const { workspaceId } = useAuth();
  const { entries } = useActivityStore();
  const { bookings } = useBookingsStore();
  const { jobs } = useJobsStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);

  const recentActivity = entries;

  // Compute workload counts per member
  const getWorkload = (memberId: string) => {
    const memberBookings = bookings.filter((b) => b.assignedToId === memberId && b.status !== "cancelled");
    const memberJobs = jobs.filter((j) => j.assignedToId === memberId);
    const memberTasks = memberJobs.reduce((sum, j) => sum + j.tasks.filter((t) => !t.completed).length, 0);
    return { bookings: memberBookings.length, jobs: memberJobs.length, tasks: memberTasks, total: memberBookings.length + memberTasks };
  };

  // Compute performance per member
  const getPerformance = (memberId: string) => {
    const memberBookings = bookings.filter((b) => b.assignedToId === memberId);
    const completedBookings = memberBookings.filter((b) => b.status === "completed");
    const revenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const memberJobs = jobs.filter((j) => j.assignedToId === memberId);
    const completedTasks = memberJobs.reduce((sum, j) => sum + j.tasks.filter((t) => t.completed).length, 0);
    return { bookings: completedBookings.length, revenue, tasks: completedTasks };
  };

  const handleRowClick = (member: TeamMember) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingMember(undefined);
    setFormOpen(true);
  };

  const columns: Column<TeamMember>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">{m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground">{m.name}</p>
            {m.title && <p className="text-[11px] text-text-tertiary">{m.title}</p>}
          </div>
        </div>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (m) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.role] || ""}`}>
          {ROLE_LABELS[m.role] || m.role}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (m) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          m.status === "active" ? "bg-emerald-50 text-emerald-700" :
          m.status === "invited" ? "bg-yellow-50 text-yellow-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {m.status === "active" ? "Active" : m.status === "invited" ? "Invited" : "Inactive"}
        </span>
      ),
    },
    {
      key: "moduleAccess" as keyof TeamMember,
      label: "Modules",
      render: (m) => {
        if (m.role === "owner" || m.role === "admin") {
          return <span className="text-[11px] text-text-tertiary">All modules</span>;
        }
        const count = m.moduleAccess?.length ?? 0;
        return (
          <span className="text-[11px] text-text-tertiary">
            {count === 0 ? "All modules" : `${count} module${count !== 1 ? "s" : ""}`}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Team"
        description={`${members.length} team member${members.length !== 1 ? "s" : ""}`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4" /> Invite Member
          </Button>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="w-10 h-10" />}
          title="Just you for now"
          description="Invite team members to collaborate — assign tasks, share calendars, and split the workload."
          setupSteps={[
            { label: "Invite your first team member", description: "They'll get an email with access to your workspace", action: handleAdd },
          ]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<TeamMember> storageKey="magic-crm-team-columns" columns={columns} data={members} keyExtractor={(m) => m.id} onRowClick={handleRowClick} />
        </div>
      )}

      <TeamMemberForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMember(undefined);
        }}
        member={editingMember}
      />

      {members.length > 0 && (
      <>
      <FeatureSection moduleId="team" featureId="activity-log" featureLabel="Team Activity Log">
        <div className="mt-6 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Team Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-4">No team activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-1.5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground">{entry.description}</p>
                    <p className="text-[11px] text-text-tertiary">{new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="workload-view" featureLabel="Workload View">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Workload</h3>
          {members.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-4">Add team members to see workload distribution.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => {
                const wl = getWorkload(m.id);
                return (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><span className="text-[9px] font-bold text-white">{m.name[0]}</span></div>
                      <span className="text-[13px] text-foreground">{m.name}</span>
                    </div>
                    <div className="flex gap-3 text-[12px] text-text-tertiary">
                      <span>{wl.bookings} booking{wl.bookings !== 1 ? "s" : ""}</span>
                      <span>{wl.tasks} task{wl.tasks !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="availability-per-member" featureLabel="Member Availability">
        <MemberAvailabilityPanel workspaceId={workspaceId ?? undefined} />
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="performance-dashboard" featureLabel="Performance Dashboard">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Performance</h3>
          {members.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-4">Add team members to track performance.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => {
                const perf = getPerformance(m.id);
                return (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
                    <span className="text-[13px] text-foreground">{m.name}</span>
                    <div className="flex gap-4 text-[11px] text-text-tertiary">
                      <span>{perf.bookings} booking{perf.bookings !== 1 ? "s" : ""}</span>
                      <span>${perf.revenue.toLocaleString()}</span>
                      <span>{perf.tasks} task{perf.tasks !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="commission-tracking" featureLabel="Commission Tracking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Commission tracking is active</p>
          <p className="text-[11px] text-text-tertiary">Set commission rates per team member in their profile. Commissions are calculated from completed bookings.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="shift-scheduling" featureLabel="Shift Scheduling">
        <ShiftScheduler workspaceId={workspaceId ?? undefined} />
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="time-off-requests" featureLabel="Time-Off Requests">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Time-Off Requests</p>
          <p className="text-[11px] text-text-tertiary">No pending requests. Team members can request time off from their profile.</p>
        </div>
      </FeatureSection>
      </>
      )}
    </div>
  );
}
