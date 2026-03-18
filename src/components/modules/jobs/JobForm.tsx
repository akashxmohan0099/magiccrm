"use client";

import { useState, useEffect } from "react";
import { useJobsStore } from "@/store/jobs";
import { useClientsStore } from "@/store/clients";
import { Job, JobStage } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";
import { DateField } from "@/components/ui/DateField";
import { Button } from "@/components/ui/Button";

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  job?: Job;
}

const STAGE_OPTIONS: { value: JobStage; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function JobForm({ open, onClose, job }: JobFormProps) {
  const { addJob, updateJob } = useJobsStore();
  const { clients } = useClientsStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [stage, setStage] = useState<JobStage>("not-started");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (job) {
        setTitle(job.title);
        setDescription(job.description);
        setClientId(job.clientId || "");
        setStage(job.stage);
        setDueDate(job.dueDate || "");
      } else {
        setTitle("");
        setDescription("");
        setClientId("");
        setStage("not-started");
        setDueDate("");
      }
      setErrors({});
    }
  }, [open, job]);

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
    if (!validate()) return;

    const data = {
      title: title.trim(),
      description: description.trim(),
      clientId: clientId || undefined,
      stage,
      dueDate: dueDate || undefined,
    };

    if (job) {
      updateJob(job.id, data);
    } else {
      addJob(data);
    }

    onClose();
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={job ? "Edit Job" : "New Job"}
    >
      <form onSubmit={handleSubmit} className="space-y-1">
        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Redesign"
            className="w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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

        <FormField label="Stage">
          <SelectField
            value={stage}
            onChange={(e) => setStage(e.target.value as JobStage)}
            options={STAGE_OPTIONS}
          />
        </FormField>

        <FormField label="Due Date">
          <DateField
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {job ? "Save Changes" : "Create Job"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}
