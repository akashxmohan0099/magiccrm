import { createClient } from "@/lib/supabase";
import type { ActivityEntry } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapActivityFromDB(row: Record<string, unknown>): ActivityEntry {
  return {
    id: row.id as string,
    type: row.type as string,
    module: row.module as string,
    description: row.description as string,
    entityId: (row.entity_id as string) || undefined,
    timestamp: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchActivityLog(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return data;
}

export async function dbCreateActivity(
  workspaceId: string,
  entry: ActivityEntry
) {
  const supabase = createClient();
  const { error } = await supabase.from("activity_log").insert({
    id: entry.id,
    workspace_id: workspaceId,
    type: entry.type,
    module: entry.module,
    description: entry.description,
    entity_id: entry.entityId || null,
    created_at: entry.timestamp,
  });

  if (error) throw error;
}

export async function dbUpsertActivityLog(
  workspaceId: string,
  entries: ActivityEntry[]
) {
  if (entries.length === 0) return;

  const supabase = createClient();
  const rows = entries.map((e) => ({
    id: e.id,
    workspace_id: workspaceId,
    type: e.type,
    module: e.module,
    description: e.description,
    entity_id: e.entityId || null,
    created_at: e.timestamp,
  }));

  const { error } = await supabase
    .from("activity_log")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}

export async function dbClearActivityLog(workspaceId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("activity_log")
    .delete()
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
