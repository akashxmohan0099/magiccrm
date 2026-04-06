import { createClient } from "@/lib/supabase";

/**
 * Notes are stored in the `documents` table with type = 'note'.
 * This keeps them in the same workspace-scoped, RLS-protected table
 * while distinguishing them from file-based documents.
 */

export interface NoteRow {
  id: string;
  workspace_id: string;
  name: string; // title
  content: string; // HTML
  type: string; // 'note'
  pinned: boolean;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export function mapNoteFromDB(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: (row.name as string) || "Untitled",
    content: (row.content as string) || "",
    pinned: (row.pinned as boolean) ?? false,
    linkedClient: (row.client_id as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function noteToRow(workspaceId: string, note: { id: string; title: string; content: string; pinned: boolean; linkedClient: string | null; createdAt: string; updatedAt: string }) {
  return {
    id: note.id,
    workspace_id: workspaceId,
    name: note.title,
    content: note.content,
    type: "note",
    pinned: note.pinned,
    client_id: note.linkedClient || null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

export async function fetchNotes(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("type", "note")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateNote(workspaceId: string, note: { id: string; title: string; content: string; pinned: boolean; linkedClient: string | null; createdAt: string; updatedAt: string }) {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .insert(noteToRow(workspaceId, note));
  if (error) throw error;
}

export async function dbUpdateNote(workspaceId: string, id: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.name = updates.title;
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.pinned !== undefined) row.pinned = updates.pinned;
  if (updates.linkedClient !== undefined) row.client_id = updates.linkedClient || null;

  const { error } = await supabase
    .from("documents")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteNote(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .eq("type", "note");
  if (error) throw error;
}

export async function dbUpsertNotes(workspaceId: string, notes: Array<{ id: string; title: string; content: string; pinned: boolean; linkedClient: string | null; createdAt: string; updatedAt: string }>) {
  if (notes.length === 0) return;
  const supabase = createClient();
  const rows = notes.map((n) => noteToRow(workspaceId, n));
  const { error } = await supabase.from("documents").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
