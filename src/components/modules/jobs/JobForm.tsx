"use client";

import { useState, useEffect } from "react";
import { useJobsStore } from "@/store/jobs";
import { useClientsStore } from "@/store/clients";
import { Job } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { DateField } from "@/components/ui/DateField";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { CustomFieldsSection } from "@/components/modules/shared/CustomFieldsSection";
import { TeamMemberPicker } from "@/components/ui/TeamMemberPicker";
import { useModuleEnabled } from "@/hooks/useFeature";
import { useAuth } from "@/hooks/useAuth";

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  job?: Job;
  prefill?: { clientId?: string };
}

export function JobForm({ open, onClose, job, prefill }: JobFormProps) {
  const { addJob, updateJob } = useJobsStore();
  const { clients } = useClientsStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const teamEnabled = useModuleEnabled("team");
  const stageOptions = config.jobStages.map((s) => ({ value: s.id, label: s.label }));
  const defaultStage = config.jobStages.find((s) => !s.isClosed)?.id ?? config.jobStages[0]?.id ?? "not-started";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [stage, setStage] = useState(defaultStage);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);
  const [assignedToName, setAssignedToName] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [customData, setCustomData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (open) {
      if (job) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(job.title);
        setDescription(job.description);
        setClientId(job.clientId || "");
        setStage(job.stage);
        setDueDate(job.dueDate || "");
        setPriority((job as unknown as Record<string, string>).priority ?? "");
        setAssignedToId(job.assignedToId);
        setAssignedToName(job.assignedToName);
        setCustomData((job as unknown as Record<string, unknown>)?.customData as Record<string, unknown> ?? {});
      } else {
        setTitle("");
        setDescription("");
        setClientId(prefill?.clientId ?? "");
        setStage(defaultStage);
        setDueDate("");
        setPriority("");
        setAssignedToId(undefined);
        setAssignedToName(undefined);
        setCustomData({});
      }
      setErrors({});
    }
  }, [open, job, prefill]);

  const clientOptions = [
    { value: "", label: "No client" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    const data = {
      title: title.trim(),
      description: description.trim(),
      clientId: clientId || undefined,
      stage,
      dueDate: dueDate || undefined,
      priority: priority || undefined,
      assignedToId: assignedToId || undefined,
      assignedToName: assignedToName || undefined,
      ...(Object.keys(customData).length > 0 ? { customData } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    if (job) {
      updateJob(job.id, data, workspaceId ?? undefined);
    } else {
      addJob(data, workspaceId ?? undefined);
    }

    onClose();
    setSaving(false);
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={job ? `Edit ${vocab.job}` : vocab.addJob}
    >
      <form onSubmit={handleSubmit} className="space-y-1">
        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Redesign"
            className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </FormField>

        <FormField label="Description">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the job or project..."
            rows={4}
          />
        </FormField>

        <FormField label="Client">
          <SelectField
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clientOptions}
          />
        </FormField>

        {teamEnabled && (
          <TeamMemberPicker
            value={assignedToId}
            onChange={(id, name) => {
              setAssignedToId(id);
              setAssignedToName(name);
            }}
          />
        )}

        <FormField label="Stage">
          <SelectField
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            options={stageOptions}
          />
        </FormField>

        <FormField label="Due Date">
          <DateField
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </FormField>

        <FeatureSection moduleId="jobs-projects" featureId="job-priority">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30">
              <option value="">Not set</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </FeatureSection>


        {/* Persona custom fields */}
        {(config.customFields?.jobs ?? []).length > 0 && (
          <div className="border-t border-border-light pt-5 mt-2">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Additional Details</p>
            <CustomFieldsSection
              fields={config.customFields?.jobs ?? []}
              values={customData}
              onChange={setCustomData}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {job ? "Save Changes" : `Create ${vocab.job}`}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
