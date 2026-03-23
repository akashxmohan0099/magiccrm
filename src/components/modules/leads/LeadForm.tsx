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
import { FeatureSection } from "@/components/modules/FeatureSection";

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
    lostReason: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [leadScore, setLeadScore] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    if (open) {
      if (lead) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company ?? "",
          source: lead.source ?? "",
          stage: lead.stage,
          value: lead.value != null ? String(lead.value) : "",
          notes: lead.notes,
          lostReason: (lead as unknown as Record<string, string>).lostReason ?? "",
        });
        setLeadScore((lead as unknown as Record<string, string>).score ?? "");
      } else {
        setForm(emptyForm);
        setLeadScore("");
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
      lostReason: form.stage === "lost" ? form.lostReason.trim() : undefined,
      assignedTo: assignedTo || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

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
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            placeholder="Full name"
          />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            placeholder="email@example.com"
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            placeholder="(555) 123-4567"
          />
        </FormField>

        <FormField label="Company">
          <input
            type="text"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            placeholder="Company name"
          />
        </FormField>

        <FeatureSection moduleId="leads-pipeline" featureId="lead-source-tracking" featureLabel="Source Tracking">
          <FormField label="Source">
            <input
              type="text"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              placeholder="e.g. Referral, Website, Social"
            />
          </FormField>
        </FeatureSection>

        <FeatureSection moduleId="leads-pipeline" featureId="auto-assign-leads" featureLabel="Auto-Assign">
          <FormField label="Assign to">
            <SelectField value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} options={[
              { value: "", label: "Unassigned" },
              { value: "me", label: "Me" },
            ]} />
          </FormField>
        </FeatureSection>

        <FormField label="Stage">
          <SelectField
            options={stageOptions}
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
          />
        </FormField>

        {form.stage === "lost" && (
          <FeatureSection moduleId="leads-pipeline" featureId="lead-lost-reason">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Lost Reason</label>
              <textarea
                value={form.lostReason}
                onChange={(e) => set("lostReason", e.target.value)}
                placeholder="Why was this lead lost?"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
              />
            </div>
          </FeatureSection>
        )}

        <FormField label="Value">
          <input
            type="number"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </FormField>

        <FeatureSection moduleId="leads-pipeline" featureId="lead-scoring" featureLabel="Lead Scoring">
          <FormField label="Lead Score">
            <div className="flex gap-2">
              {["cold", "warm", "hot"].map((score) => (
                <button key={score} type="button" onClick={() => setLeadScore(score)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer capitalize ${
                    leadScore === score
                      ? score === "hot" ? "bg-red-100 text-red-700" : score === "warm" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                      : "bg-surface text-text-secondary hover:bg-surface/80"
                  }`}>{score}</button>
              ))}
            </div>
          </FormField>
        </FeatureSection>

        <FeatureSection moduleId="leads-pipeline" featureId="lead-notes-log" featureLabel="Notes & Activity Log">
          <FormField label="Notes">
            <TextArea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </FormField>
        </FeatureSection>

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
