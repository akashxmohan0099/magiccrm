"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
  Receipt,
  FolderKanban,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useActivityStore } from "@/store/activity";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { useInvoicesStore } from "@/store/invoices";
import { useBookingsStore } from "@/store/bookings";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { LinkedRecords } from "@/components/modules/LinkedRecords";
import { ClientForm } from "./ClientForm";
import { ClientTags } from "./ClientTags";
import { SegmentationFilters } from "./SegmentationFilters";
import { FollowUpSection } from "./FollowUpSection";
import { RelationshipsSection } from "./RelationshipsSection";
import { DiscussionThread } from "@/components/ui/DiscussionThread";

interface ClientDetailProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientDetail({ open, onClose, clientId }: ClientDetailProps) {
  const { getClient, deleteClient, updateClient } = useClientsStore();
  const { workspaceId } = useAuth();
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const { invoices } = useInvoicesStore();
  const { bookings } = useBookingsStore();
  const { entries: activityEntries } = useActivityStore();
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const customFieldDefs = config.customFields.clients ?? [];
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const client = clientId ? getClient(clientId) : undefined;

  const clientActivities = useMemo(() => {
    if (!client) return [];
    return activityEntries.filter(
      (entry) =>
        entry.entityId === client.id ||
        entry.description.toLowerCase().includes(client.name.toLowerCase())
    );
  }, [activityEntries, client]);

  const linkedLeads = clientId ? leads.filter((l) => l.clientId === clientId).length : 0;
  const linkedJobs = clientId ? jobs.filter((j) => j.clientId === clientId).length : 0;
  const linkedInvoices = clientId ? invoices.filter((i) => i.clientId === clientId).length : 0;
  const linkedBookings = clientId ? bookings.filter((b) => b.clientId === clientId).length : 0;
  const hasLinkedRecords = linkedLeads + linkedJobs + linkedInvoices + linkedBookings > 0;

  if (!client) {
    return (
      <SlideOver open={open} onClose={onClose} title={`${vocab.client} Details`}>
        <p className="text-text-secondary text-sm">{vocab.client} not found.</p>
      </SlideOver>
    );
  }

  const handleDelete = () => {
    deleteClient(client.id, workspaceId ?? undefined);
    onClose();
  };

  const infoRow = (
    icon: React.ReactNode,
    label: string,
    value?: string
  ) =>
    value ? (
      <div className="flex items-start gap-3 py-2">
        <span className="text-text-secondary mt-0.5">{icon}</span>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-sm text-foreground">{value}</p>
        </div>
      </div>
    ) : null;

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={`${vocab.client} Details`}>
        <div className="space-y-6">
          {/* Auto-Inactive Flag */}
          <FeatureSection moduleId="client-database" featureId="auto-inactive-flag" featureLabel="Auto-Inactive Flag">
            <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="text-[12px] text-yellow-800">This client has been inactive. Consider reaching out.</p>
            </div>
          </FeatureSection>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground tracking-tight">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-sm text-text-secondary mt-0.5">
                  {client.company}
                </p>
              )}
              <div className="mt-2">
                <StatusBadge status={client.status} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Contact Information
            </h4>
            {infoRow(
              <Mail className="w-4 h-4" />,
              "Email",
              client.email
            )}
            {infoRow(
              <Phone className="w-4 h-4" />,
              "Phone",
              client.phone || undefined
            )}
            {infoRow(
              <Building2 className="w-4 h-4" />,
              "Company",
              client.company
            )}
            {infoRow(
              <MapPin className="w-4 h-4" />,
              "Address",
              client.address
            )}
            {infoRow(
              <Calendar className="w-4 h-4" />,
              "Client Since",
              new Date(client.createdAt).toLocaleDateString()
            )}
            {client.source && (
              <div className="flex items-start gap-3 py-2">
                <span className="text-text-secondary mt-0.5">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs text-text-secondary">Source</p>
                  <p className="text-sm text-foreground capitalize">
                    {client.source}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Client Credit Balance */}
          <FeatureSection moduleId="client-database" featureId="client-credit-balance" featureLabel="Client Credits">
            <div className="flex items-center justify-between px-4 py-3 bg-surface/50 rounded-xl mb-3">
              <span className="text-[13px] text-text-secondary">Credit Balance</span>
              <span className="text-[15px] font-bold text-foreground">$0.00</span>
            </div>
          </FeatureSection>

          {/* Notes */}
          {client.notes && (
            <div className="bg-surface rounded-lg p-4 border border-border-light">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Notes
              </h4>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}

          {/* Linked Records */}
          <LinkedRecords clientId={client.id} onNavigate={onClose} />

          {/* Quick Actions */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Link
                href="/dashboard/invoicing"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-white border border-transparent hover:border-border-light transition-all group"
              >
                <Receipt className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                <span>Create Invoice for {client.name}</span>
                <Plus className="w-3.5 h-3.5 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard/bookings"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-white border border-transparent hover:border-border-light transition-all group"
              >
                <Calendar className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                <span>Book Appointment</span>
                <Plus className="w-3.5 h-3.5 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard/jobs"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-foreground hover:bg-white border border-transparent hover:border-border-light transition-all group"
              >
                <FolderKanban className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                <span>Create Job</span>
                <Plus className="w-3.5 h-3.5 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldDefs.length > 0 && (() => {
            const customData = client.customData ?? {};
            const hasData = customFieldDefs.some((f) => {
              const v = customData[f.id];
              return v !== undefined && v !== "" && v !== false;
            });
            if (!hasData) return null;
            // Group by group property
            const groups: Record<string, typeof customFieldDefs> = {};
            for (const f of customFieldDefs) {
              const g = f.group ?? "Details";
              if (!groups[g]) groups[g] = [];
              groups[g].push(f);
            }
            return (
              <div className="bg-surface rounded-lg p-4 border border-border-light">
                {Object.entries(groups).map(([groupLabel, fields]) => (
                  <div key={groupLabel} className="mb-3 last:mb-0">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{groupLabel}</h4>
                    <div className="space-y-1.5">
                      {fields.map((f) => {
                        const val = customData[f.id];
                        if (val === undefined || val === "" || val === false) return null;
                        return (
                          <div key={f.id} className="flex items-start gap-3 py-1">
                            <div>
                              <p className="text-xs text-text-secondary">{f.label}</p>
                              <p className="text-sm text-foreground">{f.type === "toggle" ? "Yes" : String(val)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Relationships */}
          {config.relationships.length > 0 && (
            <RelationshipsSection
              clientId={client.id}
              relationships={client.relationships ?? []}
              onUpdate={(relationships) => updateClient(client.id, { relationships }, workspaceId ?? undefined)}
            />
          )}

          {/* Tags - Feature Gated */}
          <FeatureSection moduleId="client-database" featureId="client-tags">
            <ClientTags clientId={client.id} />
          </FeatureSection>

          {/* Segmentation Filters - Feature Gated */}
          <FeatureSection
            moduleId="client-database"
            featureId="segmentation-filters"
          >
            <SegmentationFilters onFilterChange={() => {}} />
          </FeatureSection>

          {/* Follow-Up Reminders - Feature Gated */}
          <FeatureSection
            moduleId="client-database"
            featureId="follow-up-reminders"
          >
            <FollowUpSection clientId={client.id} />
          </FeatureSection>

          {/* Activity Timeline - Feature Gated */}
          <FeatureSection moduleId="client-database" featureId="activity-timeline" featureLabel="Activity Timeline">
            <div className="mt-6">
              <h4 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Activity Timeline</h4>
              {clientActivities.length === 0 ? (
                <p className="text-[13px] text-text-tertiary">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {clientActivities.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 py-1.5">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground">{entry.description}</p>
                        <p className="text-[11px] text-text-tertiary">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FeatureSection>

          {/* Team Discussion - Feature Gated */}
          <FeatureSection moduleId="team" featureId="record-discussions" featureLabel="Team Discussion">
            <DiscussionThread entityType="client" entityId={client.id} />
          </FeatureSection>
        </div>
      </SlideOver>

      <ClientForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        client={client}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${vocab.client}`}
        message={
          hasLinkedRecords
            ? `This ${vocab.client.toLowerCase()} has ${linkedLeads} ${vocab.leads.toLowerCase()}, ${linkedJobs} ${vocab.jobs.toLowerCase()}, ${linkedInvoices} ${vocab.invoices.toLowerCase()}, and ${linkedBookings} ${vocab.bookings.toLowerCase()} linked. These will become unlinked. Are you sure you want to delete "${client.name}"?`
            : `Are you sure you want to delete "${client.name}"? This action cannot be undone.`
        }
      />
    </>
  );
}
