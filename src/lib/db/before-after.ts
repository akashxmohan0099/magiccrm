import { createClient } from "@/lib/supabase";
import type { BeforeAfterRecord } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapBeforeAfterFromDB(row: Record<string, unknown>): BeforeAfterRecord {
  return {
    id: row.id as string,
    jobId: (row.job_id as string) || undefined,
    clientId: (row.client_id as string) || undefined,
    clientName: row.client_name as string,
    title: row.title as string,
    beforePhotos: (row.before_photos as BeforeAfterRecord["beforePhotos"]) || [],
    afterPhotos: (row.after_photos as BeforeAfterRecord["afterPhotos"]) || [],
    checklist: (row.checklist as BeforeAfterRecord["checklist"]) || [],
    notes: (row.notes as string) || "",
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchBeforeAfterRecords(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("before_after_records")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateBeforeAfter(workspaceId: string, record: BeforeAfterRecord) {
  const supabase = createClient();
  const { error } = await supabase.from("before_after_records").insert({
    id: record.id,
    workspace_id: workspaceId,
    job_id: record.jobId || null,
    client_id: record.clientId || null,
    client_name: record.clientName,
    title: record.title,
    before_photos: record.beforePhotos,
    after_photos: record.afterPhotos,
    checklist: record.checklist,
    notes: record.notes,
    created_at: record.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateBeforeAfter(
  workspaceId: string,
  id: string,
  updates: Partial<BeforeAfterRecord>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.jobId !== undefined) row.job_id = updates.jobId || null;
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.beforePhotos !== undefined) row.before_photos = updates.beforePhotos;
  if (updates.afterPhotos !== undefined) row.after_photos = updates.afterPhotos;
  if (updates.checklist !== undefined) row.checklist = updates.checklist;
  if (updates.notes !== undefined) row.notes = updates.notes;

  const { error } = await supabase
    .from("before_after_records")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteBeforeAfter(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("before_after_records")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertBeforeAfterRecords(workspaceId: string, items: BeforeAfterRecord[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((r) => ({
    id: r.id,
    workspace_id: workspaceId,
    job_id: r.jobId || null,
    client_id: r.clientId || null,
    client_name: r.clientName,
    title: r.title,
    before_photos: r.beforePhotos,
    after_photos: r.afterPhotos,
    checklist: r.checklist,
    notes: r.notes,
    created_at: r.createdAt,
  }));
  const { error } = await supabase.from("before_after_records").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
