import { createClient } from "@/lib/supabase";
import type { Client } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Client (camelCase). */
export function mapClientFromDB(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || "",
    company: row.company as string | undefined,
    address: row.address as string | undefined,
    tags: (row.tags as string[]) || [],
    notes: (row.notes as string) || "",
    source: row.source as Client["source"],
    status: (row.status as Client["status"]) || "active",
    customData: (row.custom_data as Record<string, unknown>) || {},
    relationships: (row.relationships as Client["relationships"]) || [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Client (camelCase) to a Supabase-ready object (snake_case). */
function mapClientToDB(
  workspaceId: string,
  client: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (client.id !== undefined) row.id = client.id;
  if (client.name !== undefined) row.name = client.name;
  if (client.email !== undefined) row.email = client.email;
  if (client.phone !== undefined) row.phone = client.phone;
  if (client.company !== undefined) row.company = client.company || null;
  if (client.address !== undefined) row.address = client.address || null;
  if (client.tags !== undefined) row.tags = client.tags;
  if (client.notes !== undefined) row.notes = client.notes || "";
  if (client.source !== undefined) row.source = client.source || null;
  if (client.status !== undefined) row.status = client.status || "active";
  if (client.customData !== undefined) row.custom_data = client.customData || {};
  if (client.relationships !== undefined) row.relationships = client.relationships || [];
  if (client.createdAt !== undefined) row.created_at = client.createdAt;
  if (client.updatedAt !== undefined) row.updated_at = client.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all clients for a workspace. */
export async function fetchClients(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Fetch a page of clients for a workspace with total count. */
export async function fetchClientsPage(
  workspaceId: string,
  page: number,
  pageSize: number
): Promise<{ data: Record<string, unknown>[]; totalCount: number }> {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data ?? [], totalCount: count ?? 0 };
}

/** Search for potential duplicate clients by name, email, or phone. */
export async function fetchDuplicateClients(
  workspaceId: string,
  name: string,
  email: string,
  phone: string
): Promise<Record<string, unknown>[]> {
  const supabase = createClient();

  // Build an OR filter for any non-empty field
  const conditions: string[] = [];
  if (email.trim()) conditions.push(`email.ilike.%${email.trim()}%`);
  if (name.trim()) conditions.push(`name.ilike.%${name.trim()}%`);
  if (phone.trim()) conditions.push(`phone.ilike.%${phone.trim()}%`);

  if (conditions.length === 0) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .or(conditions.join(","));

  if (error) throw error;
  return data ?? [];
}

/** Insert a new client row. */
export async function dbCreateClient(
  workspaceId: string,
  client: Client
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      id: client.id,
      workspace_id: workspaceId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company || null,
      address: client.address || null,
      tags: client.tags || [],
      notes: client.notes || "",
      source: client.source || null,
      status: client.status || "active",
      custom_data: client.customData || {},
      relationships: client.relationships || [],
      created_at: client.createdAt,
      updated_at: client.updatedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing client row. Only sends fields that are provided. */
export async function dbUpdateClient(
  workspaceId: string,
  id: string,
  updates: Partial<Client>
) {
  const supabase = createClient();

  const row = mapClientToDB(workspaceId, updates as Record<string, unknown>);
  // Remove workspace_id — it's used in the filter, not the update payload
  delete row.workspace_id;

  const { error } = await supabase
    .from("clients")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a client row (cascade handles related records on DB side). */
export async function dbDeleteClient(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many clients at once (used for initial localStorage → Supabase migration). */
export async function dbUpsertClients(
  workspaceId: string,
  clients: Client[]
) {
  if (clients.length === 0) return;

  const supabase = createClient();
  const rows = clients.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company || null,
    address: c.address || null,
    tags: c.tags || [],
    notes: c.notes || "",
    source: c.source || null,
    status: c.status || "active",
    custom_data: c.customData || {},
    relationships: c.relationships || [],
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }));

  const { error } = await supabase
    .from("clients")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
