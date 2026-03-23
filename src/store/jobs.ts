import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Job, Task, TimeEntry, FileAttachment } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateClientRef } from "@/lib/validate-refs";
import {
  fetchJobs,
  dbCreateJob,
  dbUpdateJob,
  dbDeleteJob,
  dbUpsertJobs,
  dbCreateTask,
  dbUpdateTask,
  dbDeleteTask,
  dbCreateTimeEntry,
  dbDeleteTimeEntry,
} from "@/lib/db/jobs";

interface JobsStore {
  jobs: Job[];
  addJob: (data: Omit<Job, "id" | "tasks" | "timeEntries" | "files" | "createdAt" | "updatedAt">, workspaceId?: string) => Job | null;
  updateJob: (id: string, data: Partial<Job>, workspaceId?: string) => void;
  deleteJob: (id: string, workspaceId?: string) => void;
  moveJob: (id: string, stage: string, workspaceId?: string) => void;
  addTask: (jobId: string, title: string, workspaceId?: string) => void;
  updateTask: (jobId: string, taskId: string, data: Partial<Task>, workspaceId?: string) => void;
  toggleTask: (jobId: string, taskId: string, workspaceId?: string) => void;
  deleteTask: (jobId: string, taskId: string, workspaceId?: string) => void;
  addTimeEntry: (jobId: string, entry: Omit<TimeEntry, "id">, workspaceId?: string) => void;
  deleteTimeEntry: (jobId: string, entryId: string, workspaceId?: string) => void;
  addFile: (jobId: string, file: Omit<FileAttachment, "id" | "uploadedAt">) => void;
  deleteFile: (jobId: string, fileId: string) => void;
  rateJob: (id: string, rating: number, feedback?: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useJobsStore = create<JobsStore>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (data, workspaceId?) => {
        if (!validateClientRef(data.clientId)) {
          toast("Cannot create job: client not found", "error");
          return null;
        }
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

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateJob(workspaceId, job).catch((err) =>
            console.error("[jobs] dbCreateJob failed:", err)
          );
        }

        return job;
      },

      updateJob: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, ...updatedData } : j
          ),
        }));
        logActivity("update", "jobs", "Updated job");
        toast("Job updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateJob(workspaceId, id, updatedData).catch((err) =>
            console.error("[jobs] dbUpdateJob failed:", err)
          );
        }
      },

      deleteJob: (id, workspaceId?) => {
        const job = get().jobs.find((j) => j.id === id);
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
        if (job) {
          logActivity("delete", "jobs", `Deleted job "${job.title}"`);
          toast(`Job "${job.title}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteJob(workspaceId, id).catch((err) =>
              console.error("[jobs] dbDeleteJob failed:", err)
            );
          }
        }
      },

      moveJob: (id, stage, workspaceId?) => {
        const updatedAt = new Date().toISOString();
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, stage, updatedAt } : j
          ),
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateJob(workspaceId, id, { stage, updatedAt } as Partial<Job>).catch((err) =>
            console.error("[jobs] dbUpdateJob (moveJob) failed:", err)
          );
        }
      },

      addTask: (jobId, title, workspaceId?) => {
        const task: Task = { id: generateId(), title, completed: false };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId ? { ...j, tasks: [...j.tasks, task], updatedAt: new Date().toISOString() } : j
          ),
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateTask(jobId, task).catch((err) =>
            console.error("[jobs] dbCreateTask failed:", err)
          );
        }
      },

      updateTask: (jobId, taskId, data, workspaceId?) => {
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

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateTask(taskId, data).catch((err) =>
            console.error("[jobs] dbUpdateTask failed:", err)
          );
        }
      },

      toggleTask: (jobId, taskId, workspaceId?) => {
        const job = get().jobs.find((j) => j.id === jobId);
        const task = job?.tasks.find((t) => t.id === taskId);
        const newCompleted = task ? !task.completed : false;

        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  tasks: j.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: newCompleted } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : j
          ),
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateTask(taskId, { completed: newCompleted }).catch((err) =>
            console.error("[jobs] dbUpdateTask (toggle) failed:", err)
          );
        }
      },

      deleteTask: (jobId, taskId, workspaceId?) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, tasks: j.tasks.filter((t) => t.id !== taskId), updatedAt: new Date().toISOString() }
              : j
          ),
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbDeleteTask(taskId).catch((err) =>
            console.error("[jobs] dbDeleteTask failed:", err)
          );
        }
      },

      addTimeEntry: (jobId, entry, workspaceId?) => {
        const timeEntry: TimeEntry = { ...entry, id: generateId() };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, timeEntries: [...j.timeEntries, timeEntry], updatedAt: new Date().toISOString() }
              : j
          ),
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateTimeEntry(jobId, timeEntry).catch((err) =>
            console.error("[jobs] dbCreateTimeEntry failed:", err)
          );
        }
      },

      deleteTimeEntry: (jobId, entryId, workspaceId?) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? { ...j, timeEntries: j.timeEntries.filter((t) => t.id !== entryId), updatedAt: new Date().toISOString() }
              : j
          ),
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbDeleteTimeEntry(entryId).catch((err) =>
            console.error("[jobs] dbDeleteTimeEntry failed:", err)
          );
        }
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

      rateJob: (id, rating, feedback, workspaceId?) => {
        const ratingData = {
          satisfactionRating: rating,
          satisfactionFeedback: feedback,
          ratedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  satisfactionRating: rating,
                  satisfactionFeedback: feedback ?? j.satisfactionFeedback,
                  ratedAt: ratingData.ratedAt,
                  updatedAt: ratingData.updatedAt,
                }
              : j
          ),
        }));
        toast("Rating submitted");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateJob(workspaceId, id, ratingData as Partial<Job>).catch((err) =>
            console.error("[jobs] dbUpdateJob (rating) failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { jobs } = get();
          await dbUpsertJobs(workspaceId, jobs);
        } catch (err) {
          console.error("[jobs] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const jobs = await fetchJobs(workspaceId);
          set({ jobs: jobs ?? [] });
        } catch (err) {
          console.error("[jobs] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-jobs" }
  )
);
