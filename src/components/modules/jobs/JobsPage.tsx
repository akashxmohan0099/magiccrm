"use client";

import { useState, useMemo } from "react";
import { Briefcase, Plus, LayoutList, Kanban } from "lucide-react";
import { useJobsStore } from "@/store/jobs";
import { useClientsStore } from "@/store/clients";
import { Job, JobStage } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KanbanBoard, KanbanColumn } from "@/components/ui/KanbanBoard";
import { JobForm } from "./JobForm";
import { JobDetail } from "./JobDetail";

const STAGE_COLUMNS: { id: JobStage; label: string; color: string }[] = [
  { id: "not-started", label: "Not Started", color: "bg-gray-400" },
  { id: "in-progress", label: "In Progress", color: "bg-yellow-400" },
  { id: "review", label: "Review", color: "bg-purple-400" },
  { id: "completed", label: "Completed", color: "bg-green-400" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-400" },
];

type ViewMode = "list" | "board";

export function JobsPage() {
  const { jobs, moveJob } = useJobsStore();
  const { clients } = useClientsStore();
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | undefined>();
  const [detailJobId, setDetailJobId] = useState<string | null>(null);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    if (!search) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.clientId && clientMap[j.clientId]?.toLowerCase().includes(q))
    );
  }, [jobs, search, clientMap]);

  const columns: Column<Job>[] = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (j) => (
        <span className="text-text-secondary">
          {j.clientId ? clientMap[j.clientId] || "Unknown" : "\u2014"}
        </span>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      render: (j) => <StatusBadge status={j.stage} />,
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (j) => (
        <span className="text-text-secondary">
          {j.dueDate ? new Date(j.dueDate).toLocaleDateString() : "\u2014"}
        </span>
      ),
    },
    {
      key: "tasks",
      label: "Tasks",
      render: (j) => {
        const done = j.tasks.filter((t) => t.completed).length;
        const total = j.tasks.length;
        return (
          <span className="text-text-secondary text-xs">
            {total > 0 ? `${done}/${total} completed` : "\u2014"}
          </span>
        );
      },
    },
  ];

  const kanbanColumns: KanbanColumn<Job>[] = STAGE_COLUMNS.map((col) => ({
    id: col.id,
    label: col.label,
    color: col.color,
    items: filtered.filter((j) => j.stage === col.id),
  }));

  const handleNewJob = () => {
    setEditJob(undefined);
    setFormOpen(true);
  };

  const handleRowClick = (job: Job) => {
    setDetailJobId(job.id);
  };

  const handleEditFromDetail = (job: Job) => {
    setDetailJobId(null);
    setEditJob(job);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Jobs & Projects"
        description="Track your jobs, tasks, and project progress"
        actions={
          <Button onClick={handleNewJob}>
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search jobs..."
          />
        </div>
        <div className="flex items-center bg-surface rounded-lg border border-border-light p-0.5">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "list"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("board")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "board"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <Kanban className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-10 h-10" />}
          title="No jobs yet"
          description="Create your first job or project to start tracking work, tasks, and time."
          actionLabel="New Job"
          onAction={handleNewJob}
        />
      ) : view === "list" ? (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(j) => j.id}
            onRowClick={handleRowClick}
          />
        </div>
      ) : (
        <KanbanBoard
          columns={kanbanColumns}
          keyExtractor={(j) => j.id}
          onMove={(itemId, toCol) => moveJob(itemId, toCol as JobStage)}
          renderCard={(job) => (
            <div
              onClick={() => setDetailJobId(job.id)}
              className="bg-card-bg rounded-lg border border-border-light p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-foreground mb-1">
                {job.title}
              </p>
              {job.clientId && clientMap[job.clientId] && (
                <p className="text-xs text-text-secondary mb-2">
                  {clientMap[job.clientId]}
                </p>
              )}
              <div className="flex items-center justify-between">
                {job.dueDate && (
                  <span className="text-xs text-text-secondary">
                    {new Date(job.dueDate).toLocaleDateString()}
                  </span>
                )}
                {job.tasks.length > 0 && (
                  <span className="text-xs text-text-secondary">
                    {job.tasks.filter((t) => t.completed).length}/{job.tasks.length}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      )}

      <JobForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditJob(undefined);
        }}
        job={editJob}
      />

      <JobDetail
        open={detailJobId !== null}
        onClose={() => setDetailJobId(null)}
        jobId={detailJobId}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
}
