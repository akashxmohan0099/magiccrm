import { createClient } from "@/lib/supabase";
import type { TreatmentNote } from "@/types/models";

export function mapTreatmentNoteFromDB(row: Record<string, unknown>): TreatmentNote {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    clientId: row.client_id as string,
    bookingId: (row.booking_id as string | null) ?? undefined,
    serviceId: (row.service_id as string | null) ?? undefined,
    authorMemberId: (row.author_member_id as string | null) ?? undefined,
    subjective: (row.subjective as string | null) ?? undefined,
    objective: (row.objective as string | null) ?? undefined,
    assessment: (row.assessment as string | null) ?? undefined,
    plan: (row.plan as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    attachmentUrls: (row.attachment_urls as string[] | null) ?? undefined,
    locked: (row.locked as boolean | null) ?? false,
    amendments: (row.amendments as TreatmentNote["amendments"]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTreatmentNoteToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.bookingId !== undefined) row.booking_id = data.bookingId || null;
  if (data.serviceId !== undefined) row.service_id = data.serviceId || null;
  if (data.authorMemberId !== undefined) row.author_member_id = data.authorMemberId || null;
  if (data.subjective !== undefined) row.subjective = data.subjective || null;
  if (data.objective !== undefined) row.objective = data.objective || null;
  if (data.assessment !== undefined) row.assessment = data.assessment || null;
  if (data.plan !== undefined) row.plan = data.plan || null;
  if (data.notes !== undefined) row.notes = data.notes || null;
  if (data.attachmentUrls !== undefined) row.attachment_urls = data.attachmentUrls;
  if (data.locked !== undefined) row.locked = data.locked;
  if (data.amendments !== undefined) row.amendments = data.amendments;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchTreatmentNotes(workspaceId: string, clientId?: string) {
  const supabase = createClient();
  let q = supabase
    .from("treatment_notes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapTreatmentNoteFromDB);
}

export async function dbCreateTreatmentNote(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapTreatmentNoteToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("treatment_notes")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapTreatmentNoteFromDB(created);
}

export async function dbUpdateTreatmentNote(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapTreatmentNoteToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("treatment_notes")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteTreatmentNote(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("treatment_notes")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
