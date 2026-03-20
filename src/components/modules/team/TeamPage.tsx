"use client";

import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { useActivityStore } from "@/store/activity";
import { TeamMember } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { TeamMemberForm } from "./TeamMemberForm";

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", staff: "Staff" };
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-50 text-purple-700",
  admin: "bg-blue-50 text-blue-700",
  staff: "bg-surface text-text-secondary",
};

export function TeamPage() {
  const { members } = useTeamStore();
  const { entries } = useActivityStore();
  const [formOpen, setFormOpen] = useState(false);

  const recentActivity = entries;

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
  ];

  return (
    <div>
      <PageHeader
        title="Team"
        description={`${members.length} team member${members.length !== 1 ? "s" : ""}`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
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
            { label: "Invite your first team member", description: "They'll get an email with access to your CRM", action: () => setFormOpen(true) },
          ]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<TeamMember> columns={columns} data={members} keyExtractor={(m) => m.id} />
        </div>
      )}

      <TeamMemberForm open={formOpen} onClose={() => setFormOpen(false)} />

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
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><span className="text-[9px] font-bold text-white">{m.name[0]}</span></div>
                    <span className="text-[13px] text-foreground">{m.name}</span>
                  </div>
                  <span className="text-[12px] text-text-tertiary">0 tasks assigned</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="availability-per-member" featureLabel="Member Availability">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Member Availability</p>
          <p className="text-[11px] text-text-tertiary">Each team member can set their own working hours from their profile.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="performance-dashboard" featureLabel="Performance Dashboard">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Performance</h3>
          {members.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-4">Add team members to track performance.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
                  <span className="text-[13px] text-foreground">{m.name}</span>
                  <div className="flex gap-4 text-[11px] text-text-tertiary">
                    <span>0 bookings</span>
                    <span>$0 revenue</span>
                    <span>0 tasks</span>
                  </div>
                </div>
              ))}
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
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Shift Planner</h3>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-text-tertiary py-1">{d}</div>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-12 bg-surface/50 rounded border border-border-light/50 flex items-center justify-center">
                <span className="text-[10px] text-text-tertiary">{"\u2014"}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-tertiary">Assign shifts to team members by clicking on a day.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="team" featureId="time-off-requests" featureLabel="Time-Off Requests">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Time-Off Requests</p>
          <p className="text-[11px] text-text-tertiary">No pending requests. Team members can request time off from their profile.</p>
        </div>
      </FeatureSection>
    </div>
  );
}
