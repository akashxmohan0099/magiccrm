"use client";

import { useState } from "react";
import { Plus, Crown } from "lucide-react";
import { useMembershipsStore } from "@/store/memberships";
import { MembershipPlan } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { MembershipPlanForm } from "./MembershipPlanForm";

export function MembershipsPage() {
  const { plans, memberships } = useMembershipsStore();
  const [formOpen, setFormOpen] = useState(false);

  const planColumns: Column<MembershipPlan>[] = [
    { key: "name", label: "Plan", sortable: true },
    { key: "price", label: "Price", sortable: true, render: (p) => `$${p.price.toFixed(2)}/${p.interval}` },
    { key: "sessionsIncluded", label: "Sessions", render: (p) => p.unlimitedSessions ? "Unlimited" : p.sessionsIncluded ? String(p.sessionsIncluded) : "—" },
    { key: "active", label: "Status", render: (p) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
        {p.active ? "Active" : "Inactive"}
      </span>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Memberships & Packages"
        description={`${plans.length} plans, ${memberships.filter((m) => m.status === "active").length} active members`}
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Plan</Button>}
      />
      {plans.length === 0 ? (
        <EmptyState
          icon={<Crown className="w-10 h-10" />}
          title="No membership plans yet"
          description="Create session packs, recurring memberships, or VIP packages for your clients."
          setupSteps={[{ label: "Create your first plan", description: "Set pricing, sessions, and billing interval", action: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<MembershipPlan> columns={planColumns} data={plans} keyExtractor={(p) => p.id} />
        </div>
      )}
      <MembershipPlanForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
