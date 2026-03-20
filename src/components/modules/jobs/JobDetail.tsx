"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, Trash2, CalendarDays, User, Receipt } from "lucide-react";
import { useJobsStore } from "@/store/jobs";
import { useClientsStore } from "@/store/clients";
import { Job } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
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
  const vocab = useVocabulary();
  const config = useIndustryConfig();
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expenses, setExpenses] = useState<{description: string, amount: number}[]>([]);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const job = useMemo(
    () => (jobId ? jobs.find((j) => j.id === jobId) : undefined),
    [jobs, jobId]
  );

  const clientName = useMemo(() => {
    if (!job?.clientId) return null;
    return clients.find((c) => c.id === job.clientId)?.name || "Unknown";
  }, [job, clients]);

  const isClosedStage = useMemo(() => {
    if (!job) return false;
    const stageDef = config.jobStages.find((s) => s.id === job.stage);
    return stageDef?.isClosed ?? false;
  }, [job, config.jobStages]);

  if (!job) return null;

  const addExpense = () => {
    const amount = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amount)) return;
    setExpenses((prev) => [...prev, { description: expDesc.trim(), amount }]);
    setExpDesc("");
    setExpAmount("");
  };

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
            {isClosedStage && (
              <FeatureSection moduleId="jobs-projects" featureId="job-to-invoice" featureLabel="Job → Invoice">
                <Link href="/dashboard/invoicing">
                  <Button variant="secondary" size="sm">
                    <Receipt className="w-3.5 h-3.5" /> Generate Invoice
                  </Button>
                </Link>
              </FeatureSection>
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
          <div className="border-b border-border-light">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? "text-foreground border-b-2 border-foreground"
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
                <TaskList jobId={job.id} />
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

          {/* Profitability Summary */}
          <FeatureSection moduleId="jobs-projects" featureId="profitability-summary" featureLabel="Profitability">
            <div className="mt-4 p-4 bg-card-bg rounded-xl border border-border-light">
              <h4 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Profitability</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Revenue</span><span className="text-foreground font-medium">$0.00</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Expenses</span><span className="text-red-500 font-medium">-${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-[13px] border-t border-border-light pt-2"><span className="font-semibold text-foreground">Profit</span><span className="font-bold text-foreground">-${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</span></div>
              </div>
            </div>
          </FeatureSection>

          {/* Expense Tracking */}
          <FeatureSection moduleId="jobs-projects" featureId="expense-tracking" featureLabel="Expense Tracking">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Expenses</h4>
              {expenses.length === 0 ? (
                <p className="text-sm text-text-tertiary mb-3">No expenses recorded.</p>
              ) : (
                <div className="space-y-1.5 mb-3">
                  {expenses.map((exp, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-surface/50 rounded-lg">
                      <span className="text-[13px] text-foreground">{exp.description}</span>
                      <span className="text-[13px] font-semibold text-foreground">${exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 border-t border-border-light">
                    <span className="text-[13px] font-semibold text-foreground">Total</span>
                    <span className="text-[13px] font-bold text-foreground">${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Description" className="flex-1 px-3 py-1.5 bg-surface border border-border-light rounded-lg text-[13px]" />
                <input type="number" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="$" className="w-20 px-3 py-1.5 bg-surface border border-border-light rounded-lg text-[13px]" />
                <button onClick={addExpense} className="px-3 py-1.5 bg-foreground text-white rounded-lg text-[12px] font-medium cursor-pointer">Add</button>
              </div>
            </div>
          </FeatureSection>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete ${vocab.job}`}
        message={`Are you sure you want to delete "${job.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
