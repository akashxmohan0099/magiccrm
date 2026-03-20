import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Job, Task, TimeEntry, FileAttachment } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface JobsStore {
  jobs: Job[];
  addJob: (data: Omit<Job, "id" | "tasks" | "timeEntries" | "files" | "createdAt" | "updatedAt">) => Job;
  updateJob: (id: string, data: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  moveJob: (id: string, stage: string) => void;
  addTask: (jobId: string, title: string) => void;
  updateTask: (jobId: string, taskId: string, data: Partial<Task>) => void;
  toggleTask: (jobId: string, taskId: string) => void;
  deleteTask: (jobId: string, taskId: string) => void;
  addTimeEntry: (jobId: string, entry: Omit<TimeEntry, "id">) => void;
  deleteTimeEntry: (jobId: string, entryId: string) => void;
  addFile: (jobId: string, file: Omit<FileAttachment, "id" | "uploadedAt">) => void;
  deleteFile: (jobId: string, fileId: string) => void;
}

export const useJobsStore = create<JobsStore>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (data) => {
        const job: Job = {
          ...data,
          id: generateId(),
          tasks: [],
          timeEntries: [],
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ jobs: [...s.jobs, job] }));
        logActivity("create", "jobs", `Created job "${job.title}"`);
        toast(`Created job "${job.title}"`);
        return job;
      },

      updateJob: (id, data) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, ...data, updatedAt: new Date().toISOString() } : j
          ),
        }));
      },

      deleteJob: (id) => {
        const job = get().jobs.find((j) => j.id === id);
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
        if (job) {
          logActivity("delete", "jobs", `Deleted job "${job.title}"`);
          toast(`Job "${job.title}" deleted`, "info");
        }
      },

      moveJob: (id, stage) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, stage, updatedAt: new Date().toISOString() } : j
          ),
        }));
      },

      addTask: (jobId, title) => {
        const task: Task = { id: generateId(), title, completed: false };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId ? { ...j, tasks: [...j.tasks, task], updatedAt: new Date().toISOString() } : j
          ),
        }));
      },

      updateTask: (jobId, taskId, data) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  tasks: j.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...data } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : j
          ),
        }));
      },

      toggleTask: (jobId, taskId) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  tasks: j.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : j
          ),
        }));
      },

      deleteTask: (jobId, taskId) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, tasks: j.tasks.filter((t) => t.id !== taskId), updatedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      addTimeEntry: (jobId, entry) => {
        const timeEntry: TimeEntry = { ...entry, id: generateId() };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, timeEntries: [...j.timeEntries, timeEntry], updatedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      deleteTimeEntry: (jobId, entryId) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, timeEntries: j.timeEntries.filter((t) => t.id !== entryId), updatedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      addFile: (jobId, file) => {
        const attachment: FileAttachment = { ...file, id: generateId(), uploadedAt: new Date().toISOString() };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, files: [...j.files, attachment], updatedAt: new Date().toISOString() }
              : j
          ),
        }));
      },

      deleteFile: (jobId, fileId) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, files: j.files.filter((f) => f.id !== fileId), updatedAt: new Date().toISOString() }
              : j
          ),
        }));
      },
    }),
    { name: "magic-crm-jobs" }
  )
);
