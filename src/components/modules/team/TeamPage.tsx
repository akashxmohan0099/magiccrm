"use client";

import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { TeamMember } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { TeamMemberForm } from "./TeamMemberForm";

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", staff: "Staff" };
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-50 text-purple-700",
  admin: "bg-blue-50 text-blue-700",
  staff: "bg-surface text-text-secondary",
};

export function TeamPage() {
  const { members } = useTeamStore();
  const [formOpen, setFormOpen] = useState(false);

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
    </div>
  );
}
