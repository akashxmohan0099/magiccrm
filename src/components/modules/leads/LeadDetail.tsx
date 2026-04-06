"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  CalendarPlus,
  DollarSign,
  Trash2,
  UserCheck,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { useAuth } from "@/hooks/useAuth";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BookingForm } from "@/components/modules/bookings/BookingForm";

interface LeadDetailProps {
  open: boolean;
  onClose: () => void;
  leadId: string | null;
}

export function LeadDetail({ open, onClose, leadId }: LeadDetailProps) {
  const { leads, updateLead, deleteLead, moveLead, convertToClient } =
    useLeadsStore();
  const { workspaceId } = useAuth();
  const { leadStages } = useIndustryConfig();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [bookingFormOpen, setBookingFormOpen] = useState(false);

  const lead = leadId ? leads.find((l) => l.id === leadId) : undefined;

  if (!lead) {
    return (
      <SlideOver open={open} onClose={onClose} title="Lead Details">
        <p className="text-text-secondary text-sm">Lead not found.</p>
      </SlideOver>
    );
  }

  const handleDelete = () => {
    deleteLead(lead.id, workspaceId ?? undefined);
    onClose();
  };

  const handleConvert = () => {
    convertToClient(lead.id, workspaceId ?? undefined);
  };

  const handleStageChange = (stage: string) => {
    moveLead(lead.id, stage, workspaceId ?? undefined);
    setStageDropdownOpen(false);
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string) => {
    if (lead) {
      const value = field === "value" ? (editValue ? Number(editValue) : undefined) : editValue;
      updateLead(lead.id, { [field]: value }, workspaceId ?? undefined);
    }
    setEditingField(null);
  };

  const infoRow = (
    icon: React.ReactNode,
    label: string,
    value: string | undefined,
    field?: string
  ) => (
    <div
      className={`flex items-start gap-3 py-2 ${field ? "cursor-pointer hover:bg-surface/80 -mx-2 px-2 rounded-lg transition-colors" : ""}`}
      onClick={() => field && value !== undefined && startEdit(field, value || "")}
    >
      <span className="text-text-secondary mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        {field && editingField === field ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => saveEdit(field)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit(field);
              if (e.key === "Escape") setEditingField(null);
            }}
            className="text-sm text-foreground bg-transparent border-b border-primary/40 outline-none w-full py-0.5"
          />
        ) : (
          <p className="text-sm text-foreground">
            {value || (
              <span className="text-text-tertiary italic">
                Add {label.toLowerCase()}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );

  const currentStage = leadStages.find((s) => s.id === lead.stage);

  return (
    <>
      <SlideOver open={open} onClose={onClose} title="Lead Details">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground tracking-tight">
                {lead.name}
              </h3>
              {lead.company && (
                <p className="text-sm text-text-secondary mt-0.5">
                  {lead.company}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={lead.stage} />
                {lead.value != null && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    <DollarSign className="w-3.5 h-3.5" />
                    {lead.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>

          {/* Contact Info */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Contact Information
            </h4>
            {infoRow(<Mail className="w-4 h-4" />, "Email", lead.email, "email")}
            {infoRow(<Phone className="w-4 h-4" />, "Phone", lead.phone || "", "phone")}
            {infoRow(<Building2 className="w-4 h-4" />, "Company", lead.company || "", "company")}
            {infoRow(<Globe className="w-4 h-4" />, "Source", lead.source || "")}
            {infoRow(
              <Calendar className="w-4 h-4" />,
              "Created",
              new Date(lead.createdAt).toLocaleDateString()
            )}
          </div>

          {/* Lead Info */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Lead Info
            </h4>

            {/* Stage dropdown */}
            <div className="mb-3">
              <p className="text-xs text-text-secondary mb-1">Stage</p>
              <div className="relative">
                <button
                  onClick={() => setStageDropdownOpen((o) => !o)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground bg-card-bg border border-border-light rounded-lg hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {currentStage && (
                      <span
                        className={`w-2 h-2 rounded-full ${currentStage.color}`}
                      />
                    )}
                    {currentStage?.label || lead.stage}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                </button>
                {stageDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-full bg-card-bg border border-border-light rounded-lg shadow-lg py-1">
                    {leadStages.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleStageChange(s.id)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors cursor-pointer flex items-center gap-2 ${
                          s.id === lead.stage
                            ? "text-primary font-medium"
                            : "text-foreground"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${s.color}`}
                        />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Value */}
            <div
              className="mb-3 cursor-pointer hover:bg-surface/80 -mx-2 px-2 py-2 rounded-lg transition-colors"
              onClick={() => startEdit("value", lead.value?.toString() || "")}
            >
              <p className="text-xs text-text-secondary">Value</p>
              {editingField === "value" ? (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-text-secondary" />
                  <input
                    autoFocus
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveEdit("value")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit("value");
                      if (e.key === "Escape") setEditingField(null);
                    }}
                    className="text-sm text-foreground bg-transparent border-b border-primary/40 outline-none w-full py-0.5"
                  />
                </div>
              ) : (
                <p className="text-sm text-foreground">
                  {lead.value != null ? (
                    `$${lead.value.toLocaleString()}`
                  ) : (
                    <span className="text-text-tertiary italic">Add value</span>
                  )}
                </p>
              )}
            </div>

            {/* Notes */}
            <div
              className="cursor-pointer hover:bg-surface/80 -mx-2 px-2 py-2 rounded-lg transition-colors"
              onClick={() => startEdit("notes", lead.notes || "")}
            >
              <p className="text-xs text-text-secondary mb-1">Notes</p>
              {editingField === "notes" ? (
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEdit("notes")}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  rows={4}
                  className="text-sm text-foreground bg-transparent border border-primary/40 rounded-lg outline-none w-full py-1.5 px-2 resize-none"
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {lead.notes || (
                    <span className="text-text-tertiary italic">Add notes</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-surface rounded-lg p-4 border border-border-light">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Actions
            </h4>
            <div className="space-y-2">
              {lead.clientId ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    Converted to client
                  </span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConvert}
                  className="w-full"
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  Convert to Client
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBookingFormOpen(true)}
                className="w-full"
              >
                <CalendarPlus className="w-4 h-4 mr-1.5" />
                Book Trial
              </Button>
            </div>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${lead.name}"? This action cannot be undone.`}
      />

      <BookingForm
        open={bookingFormOpen}
        onClose={() => setBookingFormOpen(false)}
        prefill={{
          title: `Trial — ${lead.name}`,
          clientId: lead.clientId ?? undefined,
          serviceName: lead.name,
        }}
      />
    </>
  );
}
