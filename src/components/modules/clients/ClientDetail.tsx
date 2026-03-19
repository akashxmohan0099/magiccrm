"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { useInvoicesStore } from "@/store/invoices";
import { useBookingsStore } from "@/store/bookings";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { ClientForm } from "./ClientForm";
import { ClientTags } from "./ClientTags";
import { SegmentationFilters } from "./SegmentationFilters";
import { FollowUpSection } from "./FollowUpSection";

interface ClientDetailProps {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
}

export function ClientDetail({ open, onClose, clientId }: ClientDetailProps) {
  const { getClient, deleteClient } = useClientsStore();
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const { invoices } = useInvoicesStore();
  const { bookings } = useBookingsStore();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const client = clientId ? getClient(clientId) : undefined;

  const linkedLeads = clientId ? leads.filter((l) => l.clientId === clientId).length : 0;
  const linkedJobs = clientId ? jobs.filter((j) => j.clientId === clientId).length : 0;
  const linkedInvoices = clientId ? invoices.filter((i) => i.clientId === clientId).length : 0;
  const linkedBookings = clientId ? bookings.filter((b) => b.clientId === clientId).length : 0;
  const hasLinkedRecords = linkedLeads + linkedJobs + linkedInvoices + linkedBookings > 0;

  if (!client) {
    return (
      <SlideOver open={open} onClose={onClose} title="Client Details">
        <p className="text-text-secondary text-sm">Client not found.</p>
      </SlideOver>
    );
  }

  const handleDelete = () => {
    deleteClient(client.id);
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
      <SlideOver open={open} onClose={onClose} title="Client Details">
        <div className="space-y-6">
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
        title="Delete Client"
        message={
          hasLinkedRecords
            ? `This client has ${linkedLeads} lead${linkedLeads !== 1 ? "s" : ""}, ${linkedJobs} job${linkedJobs !== 1 ? "s" : ""}, ${linkedInvoices} invoice${linkedInvoices !== 1 ? "s" : ""}, and ${linkedBookings} booking${linkedBookings !== 1 ? "s" : ""} linked. These will become unlinked. Are you sure you want to delete "${client.name}"?`
            : `Are you sure you want to delete "${client.name}"? This action cannot be undone.`
        }
      />
    </>
  );
}
