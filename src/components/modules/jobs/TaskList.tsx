"use client";

import { useState, useMemo } from "react";
import { Plus, X, CheckSquare, Square } from "lucide-react";
import { useJobsStore } from "@/store/jobs";
import { useAuth } from "@/hooks/useAuth";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface TaskListProps {
  jobId: string;
}

export function TaskList({ jobId }: TaskListProps) {
  const { jobs, addTask, updateTask, toggleTask, deleteTask } = useJobsStore();
  const { workspaceId } = useAuth();
  const [newTask, setNewTask] = useState("");

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const tasks = job?.tasks ?? [];
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = () => {
    const title = newTask.trim();
    if (!title) return;
    addTask(jobId, title, workspaceId ?? undefined);
    setNewTask("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Progress</span>
            <span>
              {completed}/{total} completed
            </span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-surface transition-colors"
          >
            <button
              onClick={() => toggleTask(jobId, task.id, workspaceId ?? undefined)}
              className="flex-shrink-0 text-text-secondary hover:text-foreground cursor-pointer"
            >
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-foreground" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span
              className={`flex-1 text-sm ${
                task.completed
                  ? "line-through text-text-secondary"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </span>
            <FeatureSection moduleId="jobs-projects" featureId="task-delegation" featureLabel="Task Delegation">
              <input
                type="text"
                value={task.assignee || ""}
                onChange={(e) => updateTask(jobId, task.id, { assignee: e.target.value }, workspaceId ?? undefined)}
                placeholder="Assign to..."
                className="text-[11px] px-2 py-0.5 bg-surface border border-border-light rounded text-text-secondary w-24"
              />
            </FeatureSection>
            <button
              onClick={() => deleteTask(jobId, task.id, workspaceId ?? undefined)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-text-secondary hover:text-red-500 cursor-pointer transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add task input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
        <button
          onClick={handleAdd}
          disabled={!newTask.trim()}
          className="p-2 rounded-lg bg-foreground text-background hover:bg-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
