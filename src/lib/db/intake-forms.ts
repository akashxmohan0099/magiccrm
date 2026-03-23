import { createClient } from "@/lib/supabase";
import type { IntakeForm, IntakeSubmission } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapIntakeFormFromDB(row: Record<string, unknown>): IntakeForm {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    fields: (row.fields as IntakeForm["fields"]) || [],
    linkedTo: (row.linked_to as IntakeForm["linkedTo"]) || undefined,
    active: row.active as boolean,
    submissionCount: (row.submission_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapIntakeSubmissionFromDB(row: Record<string, unknown>): IntakeSubmission {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    formName: row.form_name as string,
    clientId: (row.client_id as string) || undefined,
    clientName: row.client_name as string,
    responses: (row.responses as Record<string, string | boolean>) || {},
    submittedAt: row.submitted_at as string,
  };
}

// ---------------------------------------------------------------------------
// Forms CRUD
// ---------------------------------------------------------------------------

export async function fetchIntakeForms(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("intake_forms")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateIntakeForm(workspaceId: string, form: IntakeForm) {
  const supabase = createClient();
  const { error } = await supabase.from("intake_forms").insert({
    id: form.id,
    workspace_id: workspaceId,
    name: form.name,
    description: form.description,
    fields: form.fields,
    linked_to: form.linkedTo || null,
    active: form.active,
    submission_count: form.submissionCount,
    created_at: form.createdAt,
    updated_at: form.updatedAt,
  });
  if (error) throw error;
}

export async function dbUpdateIntakeForm(
  workspaceId: string,
  id: string,
  updates: Partial<IntakeForm>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.fields !== undefined) row.fields = updates.fields;
  if (updates.linkedTo !== undefined) row.linked_to = updates.linkedTo || null;
  if (updates.active !== undefined) row.active = updates.active;
  if (updates.submissionCount !== undefined) row.submission_count = updates.submissionCount;

  const { error } = await supabase
    .from("intake_forms")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteIntakeForm(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("intake_forms")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertIntakeForms(workspaceId: string, items: IntakeForm[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((f) => ({
    id: f.id,
    workspace_id: workspaceId,
    name: f.name,
    description: f.description,
    fields: f.fields,
    linked_to: f.linkedTo || null,
    active: f.active,
    submission_count: f.submissionCount,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  }));
  const { error } = await supabase.from("intake_forms").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Submissions CRUD
// ---------------------------------------------------------------------------

export async function fetchIntakeSubmissions(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("intake_submissions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateIntakeSubmission(workspaceId: string, sub: IntakeSubmission) {
  const supabase = createClient();
  const { error } = await supabase.from("intake_submissions").insert({
    id: sub.id,
    workspace_id: workspaceId,
    form_id: sub.formId,
    form_name: sub.formName,
    client_id: sub.clientId || null,
    client_name: sub.clientName,
    responses: sub.responses,
    submitted_at: sub.submittedAt,
  });
  if (error) throw error;
}

export async function dbDeleteIntakeSubmission(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("intake_submissions")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertIntakeSubmissions(workspaceId: string, items: IntakeSubmission[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((s) => ({
    id: s.id,
    workspace_id: workspaceId,
    form_id: s.formId,
    form_name: s.formName,
    client_id: s.clientId || null,
    client_name: s.clientName,
    responses: s.responses,
    submitted_at: s.submittedAt,
  }));
  const { error } = await supabase.from("intake_submissions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
