"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, CalendarDays, User } from "lucide-react";
import { useJobsStore } from "@/store/jobs";
import { useClientsStore } from "@/store/clients";
import { Job } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { TaskList } from "./TaskList";
import { TimeTracker } from "./TimeTracker";
import { FileAttachments } from "./FileAttachments";

interface JobDetailProps {
  open: boolean;
  onClose: () => void;
  jobId: string | null;
  onEdit?: (job: Job) => void;
}

type Tab = "tasks" | "time" | "files";

export function JobDetail({ open, onClose, jobId, onEdit }: JobDetailProps) {
  const { jobs, deleteJob } = useJobsStore();
  const { clients } = useClientsStore();
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const job = useMemo(
    () => (jobId ? jobs.find((j) => j.id === jobId) : undefined),
    [jobs, jobId]
  );

  const clientName = useMemo(() => {
    if (!job?.clientId) return null;
    return clients.find((c) => c.id === job.clientId)?.name || "Unknown";
  }, [job, clients]);

  if (!job) return null;

  const handleDelete = () => {
    deleteJob(job.id);
    setConfirmDelete(false);
    onClose();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "time", label: "Time" },
    { key: "files", label: "Files" },
  ];

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={job.title}>
        <div className="space-y-6">
          {/* Header info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={job.stage} />
            </div>

            {job.description && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {job.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              {clientName && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{clientName}</span>
                </div>
              )}
              {job.dueDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{new Date(job.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(job)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-border-warm">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? "text-brand border-b-2 border-brand"
                      : "text-text-secondary hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "tasks" && (
              <FeatureSection moduleId="jobs-projects" featureId="task-lists">
                <TaskList jobId={job.id} />
              </FeatureSection>
            )}
            {activeTab === "time" && (
              <FeatureSection moduleId="jobs-projects" featureId="time-tracking">
                <TimeTracker jobId={job.id} />
              </FeatureSection>
            )}
            {activeTab === "files" && (
              <FeatureSection moduleId="jobs-projects" featureId="file-attachments">
                <FileAttachments jobId={job.id} />
              </FeatureSection>
            )}
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${job.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
