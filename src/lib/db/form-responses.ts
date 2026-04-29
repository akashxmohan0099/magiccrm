import { createClient } from "@/lib/supabase";
import type { FormResponse } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapFormResponseFromDB(row: Record<string, unknown>): FormResponse {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    formId: (row.form_id as string) || undefined,
    values: (row.values as Record<string, string>) ?? {},
    contactName: (row.contact_name as string) || undefined,
    contactEmail: (row.contact_email as string) || undefined,
    contactPhone: (row.contact_phone as string) || undefined,
    inquiryId: (row.inquiry_id as string) || undefined,
    submittedAt: row.submitted_at as string,
  };
}

function mapFormResponseToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.formId !== undefined) row.form_id = data.formId || null;
  if (data.values !== undefined) row.values = data.values ?? {};
  if (data.contactName !== undefined) row.contact_name = data.contactName || null;
  if (data.contactEmail !== undefined) row.contact_email = data.contactEmail || null;
  if (data.contactPhone !== undefined) row.contact_phone = data.contactPhone || null;
  if (data.inquiryId !== undefined) row.inquiry_id = data.inquiryId || null;
  if (data.submittedAt !== undefined) row.submitted_at = data.submittedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function fetchFormResponses(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("form_responses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFormResponseFromDB);
}

export async function dbCreateFormResponse(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapFormResponseToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("form_responses")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapFormResponseFromDB(created);
}

export async function dbUpdateFormResponse(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapFormResponseToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("form_responses")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteFormResponse(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("form_responses")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
