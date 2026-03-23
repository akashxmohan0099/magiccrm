import { createClient } from "@/lib/supabase";
import type { Job, Task, TimeEntry, FileAttachment } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase job row (snake_case) to a frontend Job (camelCase). */
export function mapJobFromDB(
  row: Record<string, unknown>,
  tasks: Task[] = [],
  timeEntries: TimeEntry[] = [],
  files: FileAttachment[] = []
): Job {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    clientId: (row.client_id as string) || undefined,
    stage: (row.stage as string) || "",
    tasks,
    timeEntries,
    files,
    dueDate: (row.due_date as string) || undefined,
    assignedToId: (row.assigned_to_id as string) || undefined,
    assignedToName: (row.assigned_to_name as string) || undefined,
    satisfactionRating: (row.satisfaction_rating as number) ?? undefined,
    satisfactionFeedback: (row.satisfaction_feedback as string) || undefined,
    ratedAt: (row.rated_at as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a Supabase task row to a frontend Task. */
export function mapTaskFromDB(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    completed: (row.completed as boolean) ?? false,
    dueDate: (row.due_date as string) || undefined,
    assignee: (row.assignee as string) || undefined,
    assigneeId: (row.assignee_id as string) || undefined,
  };
}

/** Convert a Supabase time entry row to a frontend TimeEntry. */
export function mapTimeEntryFromDB(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    description: (row.description as string) || "",
    minutes: (row.minutes as number) ?? 0,
    date: row.date as string,
    billableRate: (row.billable_rate as number) ?? undefined,
    billable: (row.billable as boolean) ?? undefined,
  };
}

/** Convert a frontend Job (camelCase) to a Supabase-ready object (snake_case). */
function mapJobToDB(
  workspaceId: string,
  job: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (job.id !== undefined) row.id = job.id;
  if (job.title !== undefined) row.title = job.title;
  if (job.description !== undefined) row.description = job.description || "";
  if (job.clientId !== undefined) row.client_id = job.clientId || null;
  if (job.stage !== undefined) row.stage = job.stage;
  if (job.dueDate !== undefined) row.due_date = job.dueDate || null;
  if (job.assignedToId !== undefined) row.assigned_to_id = job.assignedToId || null;
  if (job.assignedToName !== undefined) row.assigned_to_name = job.assignedToName || null;
  if (job.satisfactionRating !== undefined)
    row.satisfaction_rating = job.satisfactionRating ?? null;
  if (job.satisfactionFeedback !== undefined)
    row.satisfaction_feedback = job.satisfactionFeedback || null;
  if (job.ratedAt !== undefined) row.rated_at = job.ratedAt || null;
  if (job.files !== undefined) row.files = job.files || [];
  if (job.createdAt !== undefined) row.created_at = job.createdAt;
  if (job.updatedAt !== undefined) row.updated_at = job.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD — jobs
// ---------------------------------------------------------------------------

/** Fetch all jobs for a workspace, including their tasks and time entries. */
export async function fetchJobs(workspaceId: string) {
  const supabase = createClient();

  // Fetch jobs
  const { data: jobRows, error: jobErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (jobErr) throw jobErr;
  if (!jobRows || jobRows.length === 0) return [];

  const jobIds = jobRows.map((j: Record<string, unknown>) => j.id as string);

  // Fetch tasks and time entries in parallel
  const [taskResult, timeEntryResult] = await Promise.all([
    supabase
      .from("job_tasks")
      .select("*")
      .in("job_id", jobIds),
    supabase
      .from("job_time_entries")
      .select("*")
      .in("job_id", jobIds),
  ]);

  if (taskResult.error) throw taskResult.error;
  if (timeEntryResult.error) throw timeEntryResult.error;

  // Group tasks by job_id
  const tasksByJob: Record<string, Task[]> = {};
  for (const t of taskResult.data || []) {
    const jobId = (t as Record<string, unknown>).job_id as string;
    if (!tasksByJob[jobId]) tasksByJob[jobId] = [];
    tasksByJob[jobId].push(mapTaskFromDB(t as Record<string, unknown>));
  }

  // Group time entries by job_id
  const entriesByJob: Record<string, TimeEntry[]> = {};
  for (const e of timeEntryResult.data || []) {
    const jobId = (e as Record<string, unknown>).job_id as string;
    if (!entriesByJob[jobId]) entriesByJob[jobId] = [];
    entriesByJob[jobId].push(mapTimeEntryFromDB(e as Record<string, unknown>));
  }

  // Assemble full Job objects
  return jobRows.map((row: Record<string, unknown>) => {
    const id = row.id as string;
    const files = (row.files as FileAttachment[]) || [];
    return mapJobFromDB(row, tasksByJob[id] || [], entriesByJob[id] || [], files);
  });
}

/** Insert a new job row (tasks start empty). */
export async function dbCreateJob(workspaceId: string, job: Job) {
  const supabase = createClient();
  const row = mapJobToDB(workspaceId, job as unknown as Record<string, unknown>);

  const { data, error } = await supabase
    .from("jobs")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing job row. Only sends fields that are provided. */
export async function dbUpdateJob(
  workspaceId: string,
  id: string,
  updates: Partial<Job>
) {
  const supabase = createClient();

  const row = mapJobToDB(workspaceId, updates as Record<string, unknown>);
  // Remove workspace_id — it's used in the filter, not the update payload
  delete row.workspace_id;

  const { error } = await supabase
    .from("jobs")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a job row (cascade handles tasks + time entries on DB side). */
export async function dbDeleteJob(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many jobs at once (used for initial localStorage -> Supabase migration). */
export async function dbUpsertJobs(workspaceId: string, jobs: Job[]) {
  if (jobs.length === 0) return;

  const supabase = createClient();

  // Upsert job rows (without nested arrays)
  const jobRows = jobs.map((j) =>
    mapJobToDB(workspaceId, j as unknown as Record<string, unknown>)
  );
  const { error: jobErr } = await supabase
    .from("jobs")
    .upsert(jobRows, { onConflict: "id" });
  if (jobErr) throw jobErr;

  // Collect all tasks and time entries
  const allTasks: Record<string, unknown>[] = [];
  const allEntries: Record<string, unknown>[] = [];

  for (const job of jobs) {
    for (const t of job.tasks) {
      allTasks.push({
        id: t.id,
        job_id: job.id,
        title: t.title,
        completed: t.completed,
        due_date: t.dueDate || null,
        assignee: t.assignee || null,
        assignee_id: t.assigneeId || null,
      });
    }
    for (const e of job.timeEntries) {
      allEntries.push({
        id: e.id,
        job_id: job.id,
        description: e.description,
        minutes: e.minutes,
        date: e.date,
        billable_rate: e.billableRate ?? null,
        billable: e.billable ?? null,
      });
    }
  }

  // Upsert tasks and time entries in parallel
  const promises: Promise<void>[] = [];

  if (allTasks.length > 0) {
    promises.push(
      supabase
        .from("job_tasks")
        .upsert(allTasks, { onConflict: "id" })
        .then((res: { error: unknown }) => { const error = res.error;
          if (error) throw error;
        })
    );
  }
  if (allEntries.length > 0) {
    promises.push(
      supabase
        .from("job_time_entries")
        .upsert(allEntries, { onConflict: "id" })
        .then((res: { error: unknown }) => { const error = res.error;
          if (error) throw error;
        })
    );
  }

  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// CRUD — tasks
// ---------------------------------------------------------------------------

/** Insert a new task row. */
export async function dbCreateTask(jobId: string, task: Task) {
  const supabase = createClient();
  const { error } = await supabase
    .from("job_tasks")
    .insert({
      id: task.id,
      job_id: jobId,
      title: task.title,
      completed: task.completed,
      due_date: task.dueDate || null,
      assignee: task.assignee || null,
      assignee_id: task.assigneeId || null,
    });

  if (error) throw error;
}

/** Update an existing task row. */
export async function dbUpdateTask(
  taskId: string,
  updates: Partial<Task>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.completed !== undefined) row.completed = updates.completed;
  if (updates.dueDate !== undefined) row.due_date = updates.dueDate || null;
  if (updates.assignee !== undefined) row.assignee = updates.assignee || null;
  if (updates.assigneeId !== undefined) row.assignee_id = updates.assigneeId || null;

  const { error } = await supabase
    .from("job_tasks")
    .update(row)
    .eq("id", taskId);

  if (error) throw error;
}

/** Delete a task row. */
export async function dbDeleteTask(taskId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("job_tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// CRUD — time entries
// ---------------------------------------------------------------------------

/** Insert a new time entry row. */
export async function dbCreateTimeEntry(jobId: string, entry: TimeEntry) {
  const supabase = createClient();
  const { error } = await supabase
    .from("job_time_entries")
    .insert({
      id: entry.id,
      job_id: jobId,
      description: entry.description,
      minutes: entry.minutes,
      date: entry.date,
      billable_rate: entry.billableRate ?? null,
      billable: entry.billable ?? null,
    });

  if (error) throw error;
}

/** Delete a time entry row. */
export async function dbDeleteTimeEntry(entryId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("job_time_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw error;
}
