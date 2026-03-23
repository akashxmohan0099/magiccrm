import { createClient } from "@/lib/supabase";
import type { Lead } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Lead (camelCase). */
export function mapLeadFromDB(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || "",
    company: row.company as string | undefined,
    source: row.source as string | undefined,
    stage: (row.stage as string) || "new",
    value: row.value as number | undefined,
    notes: (row.notes as string) || "",
    clientId: row.client_id as string | undefined,
    lastContactedAt: row.last_contacted_at as string | undefined,
    nextFollowUpDate: row.next_follow_up_date as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Lead (camelCase) to a Supabase-ready object (snake_case). */
function mapLeadToDB(
  workspaceId: string,
  lead: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (lead.id !== undefined) row.id = lead.id;
  if (lead.name !== undefined) row.name = lead.name;
  if (lead.email !== undefined) row.email = lead.email;
  if (lead.phone !== undefined) row.phone = lead.phone;
  if (lead.company !== undefined) row.company = lead.company || null;
  if (lead.source !== undefined) row.source = lead.source || null;
  if (lead.stage !== undefined) row.stage = lead.stage;
  if (lead.value !== undefined) row.value = lead.value ?? null;
  if (lead.notes !== undefined) row.notes = lead.notes || "";
  if (lead.clientId !== undefined) row.client_id = lead.clientId || null;
  if (lead.lastContactedAt !== undefined) row.last_contacted_at = lead.lastContactedAt || null;
  if (lead.nextFollowUpDate !== undefined) row.next_follow_up_date = lead.nextFollowUpDate || null;
  if (lead.createdAt !== undefined) row.created_at = lead.createdAt;
  if (lead.updatedAt !== undefined) row.updated_at = lead.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all leads for a workspace. */
export async function fetchLeads(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new lead row. */
export async function dbCreateLead(
  workspaceId: string,
  lead: Lead
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      id: lead.id,
      workspace_id: workspaceId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company || null,
      source: lead.source || null,
      stage: lead.stage,
      value: lead.value ?? null,
      notes: lead.notes || "",
      client_id: lead.clientId || null,
      last_contacted_at: lead.lastContactedAt || null,
      next_follow_up_date: lead.nextFollowUpDate || null,
      created_at: lead.createdAt,
      updated_at: lead.updatedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing lead row. Only sends fields that are provided. */
export async function dbUpdateLead(
  workspaceId: string,
  id: string,
  updates: Partial<Lead>
) {
  const supabase = createClient();

  const row = mapLeadToDB(workspaceId, updates as Record<string, unknown>);
  // Remove workspace_id — it's used in the filter, not the update payload
  delete row.workspace_id;

  const { error } = await supabase
    .from("leads")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a lead row. */
export async function dbDeleteLead(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many leads at once (used for initial localStorage → Supabase migration). */
export async function dbUpsertLeads(
  workspaceId: string,
  leads: Lead[]
) {
  if (leads.length === 0) return;

  const supabase = createClient();
  const rows = leads.map((l) => ({
    id: l.id,
    workspace_id: workspaceId,
    name: l.name,
    email: l.email,
    phone: l.phone,
    company: l.company || null,
    source: l.source || null,
    stage: l.stage,
    value: l.value ?? null,
    notes: l.notes || "",
    client_id: l.clientId || null,
    last_contacted_at: l.lastContactedAt || null,
    next_follow_up_date: l.nextFollowUpDate || null,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  }));

  const { error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
