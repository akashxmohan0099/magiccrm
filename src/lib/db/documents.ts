import { createClient } from "@/lib/supabase";
import type { Document } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Document (camelCase). */
export function mapDocumentFromDB(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    isTemplate: (row.is_template as boolean) ?? false,
    size: (row.size as number) ?? 0,
    type: row.type as string,
    dataUrl: (row.storage_path as string) || undefined,
    signatureStatus: (row.signature_status as Document["signatureStatus"]) || undefined,
    shared: (row.shared as boolean) ?? false,
    clientId: (row.client_id as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Document (camelCase) to a Supabase-ready object (snake_case). */
function mapDocumentToDB(
  workspaceId: string,
  doc: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (doc.id !== undefined) row.id = doc.id;
  if (doc.name !== undefined) row.name = doc.name;
  if (doc.category !== undefined) row.category = doc.category;
  if (doc.isTemplate !== undefined) row.is_template = doc.isTemplate;
  if (doc.size !== undefined) row.size = doc.size;
  if (doc.type !== undefined) row.type = doc.type;
  if (doc.dataUrl !== undefined) row.storage_path = doc.dataUrl || null;
  if (doc.signatureStatus !== undefined)
    row.signature_status = doc.signatureStatus || null;
  if (doc.shared !== undefined) row.shared = doc.shared;
  if (doc.clientId !== undefined) row.client_id = doc.clientId || null;
  if (doc.createdAt !== undefined) row.created_at = doc.createdAt;
  if (doc.updatedAt !== undefined) row.updated_at = doc.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all documents for a workspace. */
export async function fetchDocuments(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new document row. */
export async function dbCreateDocument(
  workspaceId: string,
  doc: Document
) {
  const supabase = createClient();
  const row = mapDocumentToDB(workspaceId, doc as unknown as Record<string, unknown>);

  const { data, error } = await supabase
    .from("documents")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing document row. Only sends fields that are provided. */
export async function dbUpdateDocument(
  workspaceId: string,
  id: string,
  updates: Partial<Document>
) {
  const supabase = createClient();

  const row = mapDocumentToDB(workspaceId, updates as Record<string, unknown>);
  // Remove workspace_id — it's used in the filter, not the update payload
  delete row.workspace_id;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("documents")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a document row. */
export async function dbDeleteDocument(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many documents at once (used for initial localStorage → Supabase migration). */
export async function dbUpsertDocuments(
  workspaceId: string,
  documents: Document[]
) {
  if (documents.length === 0) return;

  const supabase = createClient();
  const rows = documents.map((d) =>
    mapDocumentToDB(workspaceId, d as unknown as Record<string, unknown>)
  );

  const { error } = await supabase
    .from("documents")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
