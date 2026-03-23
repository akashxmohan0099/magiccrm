import { createClient } from "@/lib/supabase";
import type { SOAPNote } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapSOAPNoteFromDB(row: Record<string, unknown>): SOAPNote {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    date: row.date as string,
    subjective: (row.subjective as string) || "",
    objective: (row.objective as string) || "",
    assessment: (row.assessment as string) || "",
    plan: (row.plan as string) || "",
    practitioner: (row.practitioner as string) || undefined,
    templateId: (row.template_id as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchSOAPNotes(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("soap_notes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateSOAPNote(workspaceId: string, note: SOAPNote) {
  const supabase = createClient();
  const { error } = await supabase.from("soap_notes").insert({
    id: note.id,
    workspace_id: workspaceId,
    client_id: note.clientId,
    client_name: note.clientName,
    date: note.date,
    subjective: note.subjective,
    objective: note.objective,
    assessment: note.assessment,
    plan: note.plan,
    practitioner: note.practitioner || null,
    template_id: note.templateId || null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  });
  if (error) throw error;
}

export async function dbUpdateSOAPNote(
  workspaceId: string,
  id: string,
  updates: Partial<SOAPNote>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.clientId !== undefined) row.client_id = updates.clientId;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.subjective !== undefined) row.subjective = updates.subjective;
  if (updates.objective !== undefined) row.objective = updates.objective;
  if (updates.assessment !== undefined) row.assessment = updates.assessment;
  if (updates.plan !== undefined) row.plan = updates.plan;
  if (updates.practitioner !== undefined) row.practitioner = updates.practitioner || null;
  if (updates.templateId !== undefined) row.template_id = updates.templateId || null;

  const { error } = await supabase
    .from("soap_notes")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteSOAPNote(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("soap_notes")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertSOAPNotes(workspaceId: string, items: SOAPNote[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((n) => ({
    id: n.id,
    workspace_id: workspaceId,
    client_id: n.clientId,
    client_name: n.clientName,
    date: n.date,
    subjective: n.subjective,
    objective: n.objective,
    assessment: n.assessment,
    plan: n.plan,
    practitioner: n.practitioner || null,
    template_id: n.templateId || null,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  }));
  const { error } = await supabase.from("soap_notes").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
