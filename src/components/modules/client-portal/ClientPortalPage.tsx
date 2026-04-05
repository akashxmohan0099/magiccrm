"use client";

import { useState } from "react";
import { Plus, Globe, UserCheck } from "lucide-react";
import { useClientPortalStore } from "@/store/client-portal";
import { useAuth } from "@/hooks/useAuth";
import { PortalAccess } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { PortalAccessForm } from "./PortalAccessForm";
import { FeatureSection } from "@/components/modules/FeatureSection";

export function ClientPortalPage() {
  const { config, updateConfig, accessList, revokeAccess: _revokeAccess, toggleAccess } = useClientPortalStore();
  const { workspaceId } = useAuth();
  const [formOpen, setFormOpen] = useState(false);

  const accessColumns: Column<PortalAccess>[] = [
    { key: "clientName", label: "Client", sortable: true },
    { key: "email", label: "Email" },
    { key: "lastLoginAt", label: "Last Login", render: (a) => a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : <span className="text-text-tertiary">Never</span> },
    { key: "enabled", label: "Status", render: (a) => (
      <button onClick={() => toggleAccess(a.id, workspaceId ?? undefined)} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${a.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
        {a.enabled ? "Active" : "Disabled"}
      </button>
    )},
  ];

  const toggles = [
    { key: "showBookings" as const, label: "Bookings & Appointments" },
    { key: "showInvoices" as const, label: "Invoices & Payments" },
    { key: "showDocuments" as const, label: "Shared Documents" },
    { key: "showMessages" as const, label: "Messages" },
    { key: "showJobProgress" as const, label: "Job / Project Progress" },
  ];

  return (
    <div>
      <PageHeader
        title="Client Portal"
        description="A self-service area where clients view bookings, invoices, and documents."
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> Grant Access</Button>}
      />

      <div className="space-y-6">
        <div className="bg-card-bg rounded-xl border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-[15px] font-semibold text-foreground">Portal Settings</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={config.enabled} onChange={(e) => updateConfig({ enabled: e.target.checked }, workspaceId ?? undefined)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card-bg after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          <div className="space-y-3">
            <p className="text-[13px] text-text-secondary mb-3">Choose what clients can see in their portal:</p>
            {toggles.map((t) => (
              <label key={t.key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={config[t.key]} onChange={(e) => updateConfig({ [t.key]: e.target.checked }, workspaceId ?? undefined)} className="rounded" />
                <span className="text-sm text-foreground">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <FeatureSection moduleId="client-portal" featureId="self-service-rebooking" featureLabel="Self-Service Rebooking">
          <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
            <p className="text-[13px] font-medium text-foreground">Self-Service Rebooking is active</p>
            <p className="text-[11px] text-text-tertiary">Clients can reschedule or cancel appointments from their portal without contacting you.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="client-portal" featureId="pay-from-portal" featureLabel="Pay from Portal">
          <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
            <p className="text-[13px] font-medium text-foreground">Invoice Payments via Portal</p>
            <p className="text-[11px] text-text-tertiary">Clients can view outstanding invoices and pay directly from their portal.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="client-portal" featureId="portal-messaging" featureLabel="Secure Messaging">
          <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
            <p className="text-[13px] font-medium text-foreground">Portal Messaging is active</p>
            <p className="text-[11px] text-text-tertiary">Clients can send you messages through their portal. Messages appear in your unified inbox.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="client-portal" featureId="portal-branding" featureLabel="Portal Branding">
          <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Branding</h3>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Welcome Message</label>
              <textarea value={config.welcomeMessage} onChange={(e) => updateConfig({ welcomeMessage: e.target.value }, workspaceId ?? undefined)} rows={2} placeholder="Welcome to your portal..." className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Accent Colour</label>
              <input type="color" value={config.accentColor} onChange={(e) => updateConfig({ accentColor: e.target.value }, workspaceId ?? undefined)} className="w-10 h-10 rounded-lg cursor-pointer border border-border-light" />
            </div>
          </div>
        </FeatureSection>

        {accessList.length > 0 && (
          <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
            <div className="px-5 py-3 border-b border-border-light flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">Client Access ({accessList.length})</h3>
            </div>
            <DataTable<PortalAccess> storageKey="magic-crm-portal-access-columns" columns={accessColumns} data={accessList} keyExtractor={(a) => a.id} />
          </div>
        )}
      </div>
      <PortalAccessForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
