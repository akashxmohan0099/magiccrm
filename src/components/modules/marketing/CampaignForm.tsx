"use client";

import { useState, useEffect } from "react";
import { useMarketingStore } from "@/store/marketing";
import { Campaign, CampaignType, CampaignStatus } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { DateField } from "@/components/ui/DateField";
import { Button } from "@/components/ui/Button";

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  campaign?: Campaign;
}

const typeOptions = [
  { value: "email", label: "Email" },
  { value: "social", label: "Social" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "active", label: "Active" },
];

const emptyForm = {
  name: "",
  type: "email" as CampaignType,
  status: "draft" as CampaignStatus,
  subject: "",
  content: "",
  audienceTags: "",
  scheduledAt: "",
};

export function CampaignForm({ open, onClose, campaign }: CampaignFormProps) {
  const { addCampaign, updateCampaign } = useMarketingStore();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (campaign) {
        setForm({
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          subject: campaign.subject ?? "",
          content: campaign.content,
          audienceTags: campaign.audienceTags.join(", "),
          scheduledAt: campaign.scheduledAt
            ? campaign.scheduledAt.split("T")[0]
            : "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, campaign]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Campaign name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tags = form.audienceTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      subject: form.type === "email" ? form.subject.trim() || undefined : undefined,
      content: form.content.trim(),
      audienceTags: tags,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : undefined,
    };

    if (campaign) {
      updateCampaign(campaign.id, data);
    } else {
      addCampaign(data);
    }

    onClose();
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={campaign ? "Edit Campaign" : "New Campaign"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Campaign Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-warm bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="e.g. Spring Sale Announcement"
          />
        </FormField>

        <FormField label="Type">
          <SelectField
            options={typeOptions}
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          />
        </FormField>

        <FormField label="Status">
          <SelectField
            options={statusOptions}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          />
        </FormField>

        {form.type === "email" && (
          <FormField label="Subject">
            <input
              type="text"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-warm bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Email subject line"
            />
          </FormField>
        )}

        <FormField label="Content">
          <TextArea
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder="Campaign message or body content..."
            rows={5}
          />
        </FormField>

        <FormField label="Audience Tags">
          <input
            type="text"
            value={form.audienceTags}
            onChange={(e) => set("audienceTags", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-warm bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="e.g. vip, new-customer, local"
          />
          <p className="text-xs text-text-secondary mt-1">
            Comma-separated list of tags
          </p>
        </FormField>

        <FormField label="Scheduled Date">
          <DateField
            value={form.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-warm">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {campaign ? "Save Changes" : "Create Campaign"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
