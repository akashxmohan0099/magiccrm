import { createClient } from "@/lib/supabase";
import type { Reminder } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapReminderFromDB(row: Record<string, unknown>): Reminder {
  return {
    id: row.id as string,
    title: row.title as string,
    entityType: row.entity_type as Reminder["entityType"],
    entityId: row.entity_id as string,
    dueDate: row.due_date as string,
    completed: row.completed as boolean,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchReminders(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function dbCreateReminder(
  workspaceId: string,
  reminder: Reminder
) {
  const supabase = createClient();
  const { error } = await supabase.from("reminders").insert({
    id: reminder.id,
    workspace_id: workspaceId,
    title: reminder.title,
    entity_type: reminder.entityType,
    entity_id: reminder.entityId,
    due_date: reminder.dueDate,
    completed: reminder.completed,
    created_at: reminder.createdAt,
  });

  if (error) throw error;
}

export async function dbUpdateReminder(
  workspaceId: string,
  id: string,
  updates: Partial<Reminder>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};

  if (updates.title !== undefined) row.title = updates.title;
  if (updates.entityType !== undefined) row.entity_type = updates.entityType;
  if (updates.entityId !== undefined) row.entity_id = updates.entityId;
  if (updates.dueDate !== undefined) row.due_date = updates.dueDate;
  if (updates.completed !== undefined) row.completed = updates.completed;

  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("reminders")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteReminder(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertReminders(
  workspaceId: string,
  reminders: Reminder[]
) {
  if (reminders.length === 0) return;

  const supabase = createClient();
  const rows = reminders.map((r) => ({
    id: r.id,
    workspace_id: workspaceId,
    title: r.title,
    entity_type: r.entityType,
    entity_id: r.entityId,
    due_date: r.dueDate,
    completed: r.completed,
    created_at: r.createdAt,
  }));

  const { error } = await supabase
    .from("reminders")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
