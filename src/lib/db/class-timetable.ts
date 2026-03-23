import { createClient } from "@/lib/supabase";
import type { ClassDefinition } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapClassFromDB(row: Record<string, unknown>): ClassDefinition {
  return {
    id: row.id as string,
    name: row.name as string,
    instructor: (row.instructor as string) || undefined,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    capacity: row.capacity as number,
    enrolled: (row.enrolled as number) ?? 0,
    recurring: row.recurring as boolean,
    color: (row.color as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchClasses(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_definitions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateClass(workspaceId: string, cls: ClassDefinition) {
  const supabase = createClient();
  const { error } = await supabase.from("class_definitions").insert({
    id: cls.id,
    workspace_id: workspaceId,
    name: cls.name,
    instructor: cls.instructor || null,
    day_of_week: cls.dayOfWeek,
    start_time: cls.startTime,
    end_time: cls.endTime,
    capacity: cls.capacity,
    enrolled: cls.enrolled,
    recurring: cls.recurring,
    color: cls.color || null,
    created_at: cls.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateClass(
  workspaceId: string,
  id: string,
  updates: Partial<Omit<ClassDefinition, "id" | "createdAt">>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.instructor !== undefined) row.instructor = updates.instructor || null;
  if (updates.dayOfWeek !== undefined) row.day_of_week = updates.dayOfWeek;
  if (updates.startTime !== undefined) row.start_time = updates.startTime;
  if (updates.endTime !== undefined) row.end_time = updates.endTime;
  if (updates.capacity !== undefined) row.capacity = updates.capacity;
  if (updates.enrolled !== undefined) row.enrolled = updates.enrolled;
  if (updates.recurring !== undefined) row.recurring = updates.recurring;
  if (updates.color !== undefined) row.color = updates.color || null;

  const { error } = await supabase
    .from("class_definitions")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteClass(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("class_definitions")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertClasses(workspaceId: string, items: ClassDefinition[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    name: c.name,
    instructor: c.instructor || null,
    day_of_week: c.dayOfWeek,
    start_time: c.startTime,
    end_time: c.endTime,
    capacity: c.capacity,
    enrolled: c.enrolled,
    recurring: c.recurring,
    color: c.color || null,
    created_at: c.createdAt,
  }));
  const { error } = await supabase.from("class_definitions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
