import { createClient } from "@/lib/supabase";
import type { Resource } from "@/types/models";

export function mapResourceFromDB(row: Record<string, unknown>): Resource {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    kind: (row.kind as string | null) ?? undefined,
    locationIds: (row.location_ids as string[] | null) ?? undefined,
    enabled: (row.enabled as boolean | null) ?? true,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapResourceToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.kind !== undefined) row.kind = data.kind || null;
  if (data.locationIds !== undefined) row.location_ids = data.locationIds;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchResources(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapResourceFromDB);
}

export async function dbCreateResource(workspaceId: string, data: Record<string, unknown>) {
  const supabase = createClient();
  const row = mapResourceToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("resources")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapResourceFromDB(created);
}

export async function dbUpdateResource(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapResourceToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("resources")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteResource(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
