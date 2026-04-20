import { createClient } from "@/lib/supabase";
import type { Form, FormType, FormFieldConfig } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Form (camelCase). */
export function mapFormFromDB(row: Record<string, unknown>): Form {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    type: row.type as FormType,
    name: row.name as string,
    fields: row.fields as FormFieldConfig[],
    branding: (row.branding ?? {}) as { logo?: string; primaryColor?: string; accentColor?: string },
    slug: (row.slug as string) || undefined,
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Form (camelCase) to a Supabase-ready object (snake_case). */
function mapFormToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.type !== undefined) row.type = data.type;
  if (data.name !== undefined) row.name = data.name;
  if (data.fields !== undefined) row.fields = data.fields;
  if (data.branding !== undefined) row.branding = data.branding;
  if (data.slug !== undefined) row.slug = data.slug || null;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all forms for a workspace. */
export async function fetchForms(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFormFromDB);
}

/** Insert a new form row. */
export async function dbCreateForm(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapFormToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("forms")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapFormFromDB(created);
}

/** Update an existing form row. Only sends fields that are provided. */
export async function dbUpdateForm(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapFormToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("forms")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a form row. */
export async function dbDeleteForm(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("forms")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
