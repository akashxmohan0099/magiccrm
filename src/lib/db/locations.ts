import { createClient } from "@/lib/supabase";
import type { Location } from "@/types/models";

export function mapLocationFromDB(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    address: (row.address as string | null) ?? undefined,
    kind: ((row.kind as Location["kind"]) ?? "studio") as Location["kind"],
    enabled: (row.enabled as boolean | null) ?? true,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLocationToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.address !== undefined) row.address = data.address || null;
  if (data.kind !== undefined) row.kind = data.kind;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchLocations(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapLocationFromDB);
}

export async function dbCreateLocation(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapLocationToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("locations")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapLocationFromDB(created);
}

export async function dbUpdateLocation(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapLocationToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("locations")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteLocation(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
