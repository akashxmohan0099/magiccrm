"use client";

import { useState } from "react";
import { useMarketingStore } from "@/store/marketing";
import { useAuth } from "@/hooks/useAuth";
import { Campaign, CampaignChannel, CampaignSegment, CampaignStatus } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { DateField } from "@/components/ui/DateField";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  campaign?: Campaign;
}

const channelOptions: { value: CampaignChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "both", label: "Both" },
];

const segmentOptions: { value: CampaignSegment; label: string }[] = [
  { value: "all", label: "All Clients" },
  { value: "new", label: "New Clients" },
  { value: "returning", label: "Returning Clients" },
  { value: "inactive", label: "Inactive Clients" },
  { value: "high_value", label: "High Value" },
];

const statusOptions: { value: CampaignStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
];

const emptyForm = {
  name: "",
  channel: "email" as CampaignChannel,
  targetSegment: "all" as CampaignSegment,
  status: "draft" as CampaignStatus,
  subject: "",
  body: "",
  scheduledAt: "",
};

export function CampaignForm({ open, onClose, campaign }: CampaignFormProps) {
  const formKey = campaign?.id ?? (open ? "new" : "closed");

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={campaign ? "Edit Campaign" : "New Campaign"}
    >
      {open ? (
        <CampaignFormFields key={formKey} campaign={campaign} onClose={onClose} />
      ) : null}
    </SlideOver>
  );
}

function getInitialCampaignForm(campaign?: Campaign) {
  if (!campaign) return emptyForm;

  return {
    name: campaign.name,
    channel: campaign.channel,
    targetSegment: campaign.targetSegment,
    status: campaign.status,
    subject: campaign.subject ?? "",
    body: campaign.body,
    scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.split("T")[0] : "",
  };
}

function CampaignFormFields({
  campaign,
  onClose,
}: {
  campaign?: Campaign;
  onClose: () => void;
}) {
  const { addCampaign, updateCampaign, deleteCampaign } = useMarketingStore();
  const { workspaceId } = useAuth();
  const [form, setForm] = useState(() => getInitialCampaignForm(campaign));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Campaign name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: Omit<Campaign, "id" | "createdAt" | "updatedAt"> = {
      workspaceId: workspaceId ?? "",
      name: form.name.trim(),
      channel: form.channel,
      targetSegment: form.targetSegment,
      status: form.status,
      subject: form.channel === "email" || form.channel === "both" ? form.subject.trim() || undefined : undefined,
      body: form.body.trim(),
      sentCount: campaign?.sentCount ?? 0,
      openCount: campaign?.openCount ?? 0,
      clickCount: campaign?.clickCount ?? 0,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : undefined,
    };

    if (campaign) {
      updateCampaign(campaign.id, data, workspaceId ?? undefined);
    } else {
      addCampaign(data, workspaceId ?? undefined);
    }

    onClose();
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Campaign Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            placeholder="e.g. Spring Sale Announcement"
          />
        </FormField>

        <FormField label="Channel">
          <SelectField
            options={channelOptions}
            value={form.channel}
            onChange={(e) => set("channel", e.target.value)}
          />
        </FormField>

        <FormField label="Target Segment">
          <SelectField
            options={segmentOptions}
            value={form.targetSegment}
            onChange={(e) => set("targetSegment", e.target.value)}
          />
        </FormField>

        <FormField label="Status">
          <SelectField
            options={statusOptions}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          />
        </FormField>

        {(form.channel === "email" || form.channel === "both") && (
          <FormField label="Subject">
            <input
              type="text"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              placeholder="Email subject line"
            />
          </FormField>
        )}

        <FormField label="Body">
          <TextArea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="Campaign message or body content..."
            rows={5}
          />
        </FormField>

        <FormField label="Scheduled Date">
          <DateField
            value={form.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
          {campaign && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} type="button" className="mr-auto">
              Delete
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {campaign ? "Save Changes" : "Create Campaign"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (campaign) {
            deleteCampaign(campaign.id, workspaceId ?? undefined);
            onClose();
          }
        }}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
