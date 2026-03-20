"use client";

import { useState, useEffect } from "react";
import { useLeadsStore } from "@/store/leads";
import { Lead } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead;
}

export function LeadForm({ open, onClose, lead }: LeadFormProps) {
  const { addLead, updateLead } = useLeadsStore();
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const stageOptions = config.leadStages.map((s) => ({ value: s.id, label: s.label }));
  const defaultStage = config.leadStages.find((s) => !s.isClosed)?.id ?? config.leadStages[0]?.id ?? "new";

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    stage: defaultStage,
    value: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (lead) {
        setForm({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company ?? "",
          source: lead.source ?? "",
          stage: lead.stage,
          value: lead.value != null ? String(lead.value) : "",
          notes: lead.notes,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, lead]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim() || undefined,
      source: form.source.trim() || undefined,
      stage: form.stage,
      value: form.value ? Number(form.value) : undefined,
      notes: form.notes.trim(),
    };

    if (lead) {
      updateLead(lead.id, data);
    } else {
      addLead(data as Omit<Lead, "id" | "createdAt" | "updatedAt">);
    }

    onClose();
    setSaving(false);
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={lead ? `Edit ${vocab.lead}` : vocab.addLead}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Full name"
          />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="email@example.com"
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="(555) 123-4567"
          />
        </FormField>

        <FormField label="Company">
          <input
            type="text"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Company name"
          />
        </FormField>

        <FormField label="Source">
          <input
            type="text"
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="e.g. Referral, Website, Social"
          />
        </FormField>

        <FormField label="Stage">
          <SelectField
            options={stageOptions}
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
          />
        </FormField>

        <FormField label="Value">
          <input
            type="number"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </FormField>

        <FormField label="Notes">
          <TextArea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={saving}>
            {lead ? "Save Changes" : vocab.addLead}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
