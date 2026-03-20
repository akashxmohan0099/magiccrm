"use client";

import { useState, useEffect } from "react";
import { useClientsStore } from "@/store/clients";
import { Client } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { CustomFieldsSection } from "./CustomFieldsSection";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  client?: Client;
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
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
];

function getInitialState(client?: Client) {
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
    customData: (client as any)?.customData ?? {} as Record<string, unknown>,
  };
}

export function ClientForm({ open, onClose, client }: ClientFormProps) {
  const { addClient, updateClient } = useClientsStore();
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const customFieldDefs = config.customFields.clients ?? [];
  const [form, setForm] = useState(getInitialState(client));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
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

  const handleSubmit = () => {
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
      customData: form.customData,
    };

    if (client) {
      updateClient(client.id, data);
    } else {
      addClient(data);
    }
    onClose();
    setSaving(false);
  };

  const inputClass =
    "w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";

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

        <FormField label="Notes">
          <TextArea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Any additional notes..."
          />
        </FormField>

        <FormField label="Source">
          <SelectField
            options={SOURCE_OPTIONS}
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
          />
        </FormField>

        <FormField label="Status">
          <SelectField
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          />
        </FormField>

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
