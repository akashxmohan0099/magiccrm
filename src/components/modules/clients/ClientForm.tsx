"use client";

import { useState, useEffect } from "react";
import { useClientsStore } from "@/store/clients";
import { Client } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { CustomFieldsSection } from "@/components/modules/shared/CustomFieldsSection";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
  /** Called before creating a new client. Return false to prevent creation (e.g. for duplicate warning). */
  onBeforeCreate?: (data: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
}

const SOURCE_OPTIONS = [
  { value: "", label: "Select source..." },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "social", label: "Social Media" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
  { value: "vip", label: "VIP" },
  { value: "churned", label: "Churned" },
];

function getInitialState(client?: Client) {
  const customData = client?.customData ?? {} as Record<string, unknown>;
  return {
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    company: client?.company ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
    source: client?.source ?? "",
    status: client?.status ?? "prospect",
    tags: client?.tags?.join(", ") ?? "",
    birthday: (customData.birthday as string) ?? "",
    lifecycleStage: (customData.lifecycleStage as string) ?? "",
    customData,
  };
}

export function ClientForm({ open, onClose, client, onBeforeCreate }: ClientFormProps) {
  const { addClient, updateClient } = useClientsStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const customFieldDefs = config.customFields.clients ?? [];
  const [form, setForm] = useState(getInitialState(client));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(getInitialState(client));
      setErrors({});
    }
  }, [open, client]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim(),
      source: (form.source || undefined) as Client["source"],
      status: form.status as Client["status"],
      tags,
      customData: { ...form.customData, birthday: form.birthday || undefined, lifecycleStage: form.lifecycleStage || undefined },
    };

    if (client) {
      updateClient(client.id, data, workspaceId ?? undefined);
    } else {
      // Run duplicate check before creating
      if (onBeforeCreate) {
        const shouldProceed = await onBeforeCreate(data);
        if (!shouldProceed) {
          setSaving(false);
          onClose();
          return;
        }
      }
      addClient(data, workspaceId ?? undefined);
    }
    onClose();
    setSaving(false);
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={client ? `Edit ${vocab.client}` : `New ${vocab.client}`}
    >
      <div className="space-y-1">
        <FormField label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Full name"
            className={inputClass}
          />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="email@example.com"
            className={inputClass}
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Phone number"
            className={inputClass}
          />
        </FormField>

        <FeatureSection moduleId="client-database" featureId="birthday-reminders">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Birthday</label>
            <input type="date" value={form.birthday} onChange={(e) => update("birthday", e.target.value)} className={inputClass} />
          </div>
        </FeatureSection>

        <FormField label="Company">
          <input
            type="text"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Company name"
            className={inputClass}
          />
        </FormField>

        <FormField label="Address">
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Address"
            className={inputClass}
          />
        </FormField>

        <FeatureSection moduleId="client-database" featureId="client-notes">
          <FormField label="Notes">
            <TextArea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Any additional notes..."
            />
          </FormField>
        </FeatureSection>

        <FeatureSection moduleId="client-database" featureId="client-source-tracking">
          <FormField label="Source">
            <SelectField
              options={SOURCE_OPTIONS}
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
            />
          </FormField>
        </FeatureSection>

        <FormField label="Status">
          <SelectField
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          />
        </FormField>

        <FeatureSection moduleId="client-database" featureId="client-lifecycle-stages">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Lifecycle Stage</label>
            <select value={form.lifecycleStage} onChange={(e) => update("lifecycleStage", e.target.value)} className={inputClass}>
              <option value="">Not set</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="at-risk">At Risk</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </FeatureSection>

        <FormField label="Tags">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="Comma-separated tags (e.g. vip, returning)"
            className={inputClass}
          />
        </FormField>

        {customFieldDefs.length > 0 && (
          <CustomFieldsSection
            fields={customFieldDefs}
            values={form.customData}
            onChange={(customData) => setForm((prev) => ({ ...prev, customData }))}
          />
        )}


        <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSubmit}>
            {client ? "Save Changes" : vocab.addClient}
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
