import { createClient } from "@/lib/supabase";
import type { RebookingPrompt } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapRebookingPromptFromDB(row: Record<string, unknown>): RebookingPrompt {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    serviceId: row.service_id as string,
    serviceName: row.service_name as string,
    lastBookingDate: row.last_booking_date as string,
    suggestedRebookDate: row.suggested_rebook_date as string,
    status: row.status as RebookingPrompt["status"],
    snoozedUntil: (row.snoozed_until as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchRebookingPrompts(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rebooking_prompts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateRebookingPrompt(workspaceId: string, prompt: RebookingPrompt) {
  const supabase = createClient();
  const { error } = await supabase.from("rebooking_prompts").insert({
    id: prompt.id,
    workspace_id: workspaceId,
    client_id: prompt.clientId,
    client_name: prompt.clientName,
    service_id: prompt.serviceId,
    service_name: prompt.serviceName,
    last_booking_date: prompt.lastBookingDate,
    suggested_rebook_date: prompt.suggestedRebookDate,
    status: prompt.status,
    snoozed_until: prompt.snoozedUntil || null,
    created_at: prompt.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateRebookingPrompt(
  workspaceId: string,
  id: string,
  updates: Partial<RebookingPrompt>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};

  if (updates.status !== undefined) row.status = updates.status;
  if (updates.snoozedUntil !== undefined) row.snoozed_until = updates.snoozedUntil || null;

  const { error } = await supabase
    .from("rebooking_prompts")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertRebookingPrompts(workspaceId: string, items: RebookingPrompt[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((p) => ({
    id: p.id,
    workspace_id: workspaceId,
    client_id: p.clientId,
    client_name: p.clientName,
    service_id: p.serviceId,
    service_name: p.serviceName,
    last_booking_date: p.lastBookingDate,
    suggested_rebook_date: p.suggestedRebookDate,
    status: p.status,
    snoozed_until: p.snoozedUntil || null,
    created_at: p.createdAt,
  }));
  const { error } = await supabase.from("rebooking_prompts").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
